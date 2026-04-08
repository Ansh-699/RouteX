import {
  AlertSettings,
  EventEntry,
  EventLevel,
  FailoverBanner,
  MethodStrategy,
  MonitorMode,
  MonitorSource,
  ProviderCandidate,
  ProviderCandidateOptions,
  ProviderConfig,
  ProviderHistoryPoint,
  ProviderState,
  RequestAttempt,
  RouteDecision,
  RouteExplanation,
  RouteLogEntry,
  RouteRecord,
  RoutingPreference,
  RoutingRules,
  RuntimeSettings,
  SmartMode,
} from "./types.js";
import { computeProviderScore, getProviderErrorRate } from "./scoring.js";

type StoreOptions = {
  staleAfterMs: number;
  eventLogLimit: number;
  routeLogLimit: number;
  configuredMonitorMode: MonitorMode;
  alerts: AlertSettings;
};

type RuntimeSettingsUpdate = {
  mode?: SmartMode;
  rules?: Partial<RoutingRules>;
  providerCosts?: Record<string, number>;
  alerts?: Partial<AlertSettings>;
};

function createInitialProviderState(provider: ProviderConfig): ProviderState {
  return {
    name: provider.name,
    rpcUrl: provider.rpcUrl,
    rpcHeaders: provider.rpcHeaders,
    cluster: provider.cluster ?? "mainnet-beta",
    yellowstoneUrl: provider.yellowstoneUrl,
    lastKnownSlot: null,
    slotLag: null,
    avgLatencyMs: null,
    lastLatencyMs: null,
    successCount: 0,
    errorCount: 0,
    timeoutCount: 0,
    consecutiveFailures: 0,
    lastError: null,
    lastUpdatedAt: null,
    lastHealthyAt: null,
    lastRoutedAt: null,
    healthy: false,
    active: false,
    score: null,
    writeEnabled: provider.writeEnabled !== false,
    priorityBias: provider.priorityBias ?? 0,
    costScore: provider.costScore ?? 1,
    tags: provider.tags ?? [],
    monitorSource: "none",
  };
}

function updateRollingLatency(previous: number | null, next: number): number {
  if (previous === null) {
    return next;
  }

  return Math.round(previous * 0.7 + next * 0.3);
}

function trimToLimit<T>(items: T[], limit: number) {
  if (items.length <= limit) {
    return;
  }

  items.splice(limit);
}

function buildRulesForMode(
  mode: SmartMode,
  fallbackProvider: string | null,
): RoutingRules {
  switch (mode) {
    case "fastest":
      return {
        read: "fastest",
        freshRead: "freshest",
        write: "freshest",
        fallbackProvider,
      };
    case "cheapest":
      return {
        read: "cheapest",
        freshRead: "cheapest",
        write: "freshest",
        fallbackProvider,
      };
    case "custom":
      return {
        read: "fastest",
        freshRead: "freshest",
        write: "freshest",
        fallbackProvider,
      };
    case "freshest":
    default:
      return {
        read: "freshest",
        freshRead: "freshest",
        write: "freshest",
        fallbackProvider,
      };
  }
}

function normalizeWebhookUrl(value: string | null | undefined): string | null {
  if (!value || value.trim() === "") {
    return null;
  }

  return value.trim();
}

function toSentenceFragment(reason: string, providerName: string): string {
  const trimmed = reason.trim().replace(/[.]+$/, "");
  const withoutProvider = trimmed.startsWith(`${providerName} `)
    ? trimmed.slice(providerName.length + 1)
    : trimmed;

  if (withoutProvider.length === 0) {
    return "it ranked highest";
  }

  const lowered =
    withoutProvider.charAt(0).toLowerCase() + withoutProvider.slice(1);

  if (/^(had|led|beat|stayed|was|ranked)/.test(lowered)) {
    return `it ${lowered}`;
  }

  return lowered;
}

export class ProviderStore {
  private readonly providers = new Map<string, ProviderState>();
  private readonly staleAfterMs: number;
  private readonly eventLogLimit: number;
  private readonly routeLogLimit: number;
  private readonly configuredMonitorMode: MonitorMode;
  private activeMonitorMode: MonitorMode;
  private readonly events: EventEntry[] = [];
  private readonly routeLog: RouteLogEntry[] = [];
  private readonly history = new Map<string, ProviderHistoryPoint[]>();
  private readonly runtimeSettings: RuntimeSettings;
  private nextEventId = 1;
  private nextRouteId = 1;
  private providerSwitchCount = 0;
  private lastActiveSwitchAt: string | null = null;
  private lastActiveSwitchMs = 0;
  private latestFailover: FailoverBanner | null = null;
  private static readonly SWITCH_COOLDOWN_MS = 3_000;
  private static readonly SWITCH_SCORE_THRESHOLD = 0.5;
  private static readonly HISTORY_LIMIT = 180;

  constructor(providerConfigs: ProviderConfig[], options: StoreOptions) {
    this.staleAfterMs = options.staleAfterMs;
    this.eventLogLimit = options.eventLogLimit;
    this.routeLogLimit = options.routeLogLimit;
    this.configuredMonitorMode = options.configuredMonitorMode;
    this.activeMonitorMode = options.configuredMonitorMode;

    for (const provider of providerConfigs) {
      this.providers.set(provider.name, createInitialProviderState(provider));
      this.history.set(provider.name, []);
    }

    const fallbackProvider = this.getDefaultFallbackProvider();
    this.runtimeSettings = {
      mode: "freshest",
      rules: buildRulesForMode("freshest", fallbackProvider),
      alerts: {
        telegramWebhookUrl: normalizeWebhookUrl(options.alerts.telegramWebhookUrl),
        discordWebhookUrl: normalizeWebhookUrl(options.alerts.discordWebhookUrl),
        notifyOnProviderStale: options.alerts.notifyOnProviderStale,
        notifyOnFailover: options.alerts.notifyOnFailover,
      },
    };

    this.pushEvent(
      "info",
      "startup",
      `RouteX initialized with ${providerConfigs.length} configured provider(s)`,
      null,
      {
        configuredMonitorMode: this.configuredMonitorMode,
        smartMode: this.runtimeSettings.mode,
      },
    );
  }

  getProviderCount(): number {
    return this.providers.size;
  }

  setActiveMonitorMode(mode: MonitorMode, reason: string) {
    if (this.activeMonitorMode === mode) {
      return;
    }

    this.activeMonitorMode = mode;
    this.pushEvent("info", "monitor-mode", reason, null, {
      configuredMonitorMode: this.configuredMonitorMode,
      activeMonitorMode: mode,
    });
  }

  listProviders(): ProviderState[] {
    this.refreshStaleness();

    return [...this.providers.values()].sort((left, right) => {
      const leftScore = left.score ?? Number.POSITIVE_INFINITY;
      const rightScore = right.score ?? Number.POSITIVE_INFINITY;

      if (leftScore !== rightScore) {
        return leftScore - rightScore;
      }

      return left.name.localeCompare(right.name);
    });
  }

  getBestProvider(options: ProviderCandidateOptions): ProviderState | null {
    return this.getOrderedCandidates(options)[0] ?? null;
  }

  getOrderedCandidates(options: ProviderCandidateOptions): ProviderState[] {
    return this.getCandidateEvaluations(options).map((candidate) => candidate.provider);
  }

  getRouteDecision(options: ProviderCandidateOptions): RouteDecision | null {
    const candidates = this.getCandidateEvaluations(options);
    const winner = candidates[0];

    if (!winner) {
      return null;
    }

    return {
      provider: winner.provider,
      attempts: 0,
      explanation: this.buildRouteExplanation(options, candidates, winner.provider.name, false),
    };
  }

  getCandidateEvaluations(options: ProviderCandidateOptions): ProviderCandidate[] {
    this.refreshStaleness();
    const preference = this.getPreferenceForStrategy(options.strategy);
    const fallbackProvider = this.runtimeSettings.rules.fallbackProvider;

    const candidates = [...this.providers.values()]
      .filter((provider) => {
        if (provider.lastKnownSlot === null) {
          return false;
        }

        if (options.healthyOnly !== false && !provider.healthy) {
          return false;
        }

        if (options.strategy === "write" && !provider.writeEnabled) {
          return false;
        }

        if (
          options.maxSlotLag !== null &&
          provider.slotLag !== null &&
          provider.slotLag > options.maxSlotLag
        ) {
          return false;
        }

        return true;
      })
      .map((provider) => ({
        provider,
        score: computeProviderScore(provider, preference),
        preference,
        snapshot: {
          latencyMs: provider.avgLatencyMs,
          slotLag: provider.slotLag,
          costScore: provider.costScore,
          healthy: provider.healthy,
          active: provider.active,
        },
      }))
      .filter((candidate) => candidate.score !== null)
      .sort((left, right) => {
        const scoreDelta = (left.score ?? Number.POSITIVE_INFINITY) - (right.score ?? Number.POSITIVE_INFINITY);

        if (scoreDelta !== 0) {
          return scoreDelta;
        }

        return left.provider.name.localeCompare(right.provider.name);
      });

    if (fallbackProvider) {
      const fallbackIndex = candidates.findIndex(
        (candidate) => candidate.provider.name === fallbackProvider,
      );

      if (fallbackIndex > -1 && fallbackIndex < candidates.length - 1) {
        const [fallbackCandidate] = candidates.splice(fallbackIndex, 1);
        candidates.push(fallbackCandidate);
      }
    }

    return candidates;
  }

  buildRouteExplanation(
    options: ProviderCandidateOptions,
    candidates: ProviderCandidate[],
    selectedProviderName: string | null,
    policyRelaxed: boolean,
  ): RouteExplanation {
    const preference = this.getPreferenceForStrategy(options.strategy);
    const selected =
      selectedProviderName === null
        ? null
        : candidates.find((candidate) => candidate.provider.name === selectedProviderName) ?? null;
    const runnerUp =
      selected === null
        ? candidates[0] ?? null
        : candidates.find((candidate) => candidate.provider.name !== selectedProviderName) ?? null;
    const reasons: string[] = [];

    if (selected) {
      const provider = selected.provider;

      if (preference === "freshest") {
        reasons.push(
          selected.snapshot.slotLag === null
            ? `${provider.name} has unknown slot lag`
            : `${provider.name} had the lowest freshness penalty at ${selected.snapshot.slotLag} slot lag`,
        );
      } else if (preference === "fastest") {
        reasons.push(
          selected.snapshot.latencyMs === null
            ? `${provider.name} had no latency sample yet`
            : `${provider.name} led on latency at ${Math.round(selected.snapshot.latencyMs)}ms`,
        );
      } else {
        reasons.push(
          `${provider.name} had the best cost score at ${selected.snapshot.costScore.toFixed(1)}`,
        );
      }

      if (runnerUp?.provider) {
        const next = runnerUp.provider;

        if (
          selected.snapshot.slotLag !== null &&
          runnerUp.snapshot.slotLag !== null &&
          selected.snapshot.slotLag !== runnerUp.snapshot.slotLag
        ) {
          reasons.push(
            `${provider.name} stayed ahead of ${next.name} on slot lag (${selected.snapshot.slotLag} vs ${runnerUp.snapshot.slotLag})`,
          );
        } else if (
          selected.snapshot.latencyMs !== null &&
          runnerUp.snapshot.latencyMs !== null &&
          Math.round(selected.snapshot.latencyMs) !== Math.round(runnerUp.snapshot.latencyMs)
        ) {
          reasons.push(
            `${provider.name} beat ${next.name} on latency (${Math.round(selected.snapshot.latencyMs)}ms vs ${Math.round(runnerUp.snapshot.latencyMs)}ms)`,
          );
        } else if (selected.snapshot.costScore !== runnerUp.snapshot.costScore) {
          reasons.push(
            `${provider.name} stayed cheaper than ${next.name} (${selected.snapshot.costScore.toFixed(1)} vs ${runnerUp.snapshot.costScore.toFixed(1)})`,
          );
        }
      }

      if (this.runtimeSettings.rules.fallbackProvider === provider.name) {
        reasons.push(`${provider.name} was used as the configured fallback provider`);
      }

      if (policyRelaxed) {
        reasons.push(
          "RouteX relaxed the strict freshness threshold because no provider passed the initial policy",
        );
      }
    } else if (policyRelaxed) {
      reasons.push(
        "RouteX relaxed the strict freshness threshold, but no provider was healthy enough to route the request",
      );
    } else {
      reasons.push("No provider met the current health and freshness policy");
    }

    const summary = selected
      ? `Sent to ${selected.provider.name} because ${toSentenceFragment(
          reasons[0] ?? "",
          selected.provider.name,
        )}.`
      : `No provider qualified for ${options.strategy} under ${this.runtimeSettings.mode} mode.`;

    return {
      summary,
      mode: this.runtimeSettings.mode,
      preference,
      reasons,
      fallbackProvider: this.runtimeSettings.rules.fallbackProvider,
      strictMaxSlotLag: options.maxSlotLag,
      policyRelaxed,
      candidateSnapshot: candidates.slice(0, 4).map((candidate) => ({
        providerName: candidate.provider.name,
        routeScore: candidate.score,
        preference: candidate.preference,
        latencyMs: candidate.snapshot.latencyMs,
        slotLag: candidate.snapshot.slotLag,
        costScore: candidate.snapshot.costScore,
        healthy: candidate.snapshot.healthy,
        active: candidate.snapshot.active,
      })),
    };
  }

  updateProbeSuccess(
    providerName: string,
    slot: number,
    latencyMs: number,
    source: MonitorSource,
  ) {
    const provider = this.providers.get(providerName);

    if (!provider) {
      return;
    }

    const wasHealthy = provider.healthy;
    provider.lastKnownSlot = slot;
    provider.lastLatencyMs = latencyMs;
    provider.avgLatencyMs = updateRollingLatency(provider.avgLatencyMs, latencyMs);
    provider.lastUpdatedAt = new Date().toISOString();
    provider.lastHealthyAt = provider.lastUpdatedAt;
    provider.healthy = true;
    provider.consecutiveFailures = 0;
    provider.lastError = null;
    provider.successCount += 1;
    provider.monitorSource = source;

    this.recomputeScores();

    if (!wasHealthy) {
      this.pushEvent(
        "info",
        "provider-recovered",
        `${provider.name} recovered via ${source} monitoring`,
        provider.name,
        {
          slot,
          latencyMs,
          source,
        },
      );
    }
  }

  updateProbeFailure(
    providerName: string,
    errorMessage: string,
    timeout: boolean,
    source: MonitorSource,
  ) {
    const provider = this.providers.get(providerName);

    if (!provider) {
      return;
    }

    const wasHealthy = provider.healthy;
    provider.lastUpdatedAt = new Date().toISOString();
    provider.healthy = false;
    provider.consecutiveFailures += 1;
    provider.lastError = errorMessage;
    provider.monitorSource = source;

    if (timeout) {
      provider.timeoutCount += 1;
    } else {
      provider.errorCount += 1;
    }

    this.recomputeScores();

    if (wasHealthy || provider.consecutiveFailures === 1) {
      this.pushEvent(
        timeout ? "warn" : "error",
        "provider-degraded",
        `${provider.name} probe failed: ${errorMessage}`,
        provider.name,
        {
          timeout,
          source,
        },
      );
    }
  }

  recordRequestAttempt(attempt: RequestAttempt) {
    const provider = this.providers.get(attempt.providerName);

    if (!provider) {
      return;
    }

    provider.lastLatencyMs = attempt.durationMs;
    provider.avgLatencyMs = updateRollingLatency(provider.avgLatencyMs, attempt.durationMs);
    provider.lastUpdatedAt = new Date().toISOString();
    provider.lastRoutedAt = provider.lastUpdatedAt;

    if (attempt.ok) {
      provider.successCount += 1;
      provider.healthy = true;
      provider.lastHealthyAt = provider.lastUpdatedAt;
      provider.consecutiveFailures = 0;
      provider.lastError = null;
    } else {
      provider.healthy = false;
      provider.consecutiveFailures += 1;
      provider.lastError = attempt.errorMessage;

      if (attempt.timeout) {
        provider.timeoutCount += 1;
      } else {
        provider.errorCount += 1;
      }
    }

    this.recomputeScores();
  }

  recordRoute(record: RouteRecord) {
    const routeEntry: RouteLogEntry = {
      id: this.nextRouteId,
      requestId: record.requestId,
      method: record.method,
      strategy: record.strategy,
      providerName: record.providerName,
      attemptedProviders: record.attemptedProviders,
      attempts: record.attempts,
      status: record.status,
      durationMs: record.durationMs,
      errorMessage: record.errorMessage,
      createdAt: new Date().toISOString(),
      mode: record.mode,
      explanation: record.explanation,
    };

    this.nextRouteId += 1;
    this.routeLog.unshift(routeEntry);
    trimToLimit(this.routeLog, this.routeLogLimit);

    if (record.status === "failed") {
      this.pushEvent(
        "warn",
        "route-failed",
        `${record.method} failed after ${record.attempts} attempt(s)`,
        record.providerName,
        {
          requestId: record.requestId,
          attemptedProviders: record.attemptedProviders,
          errorMessage: record.errorMessage,
        },
      );
    }
  }

  markActiveProvider(providerName: string | null) {
    const providers = this.listProviders();
    const previous = providers.find((provider) => provider.active)?.name ?? null;

    if (previous === providerName) {
      return;
    }

    const now = Date.now();
    const msSinceLastSwitch = now - this.lastActiveSwitchMs;
    if (msSinceLastSwitch < ProviderStore.SWITCH_COOLDOWN_MS) {
      return;
    }

    if (previous !== null && providerName !== null) {
      const currentState = this.providers.get(previous);
      const nextState = this.providers.get(providerName);
      if (
        currentState?.healthy &&
        currentState.score !== null &&
        nextState !== undefined &&
        nextState.score !== null &&
        currentState.score - nextState.score < ProviderStore.SWITCH_SCORE_THRESHOLD
      ) {
        return;
      }
    }

    for (const provider of this.providers.values()) {
      provider.active = provider.name === providerName;
    }

    this.providerSwitchCount += 1;
    this.lastActiveSwitchAt = new Date().toISOString();
    this.lastActiveSwitchMs = now;

    const previousState = previous ? this.providers.get(previous) ?? null : null;
    const reason =
      previousState && !previousState.healthy
        ? previousState.lastError ?? "previous provider became unhealthy"
        : providerName
          ? `${providerName} ranked higher under ${this.runtimeSettings.mode} mode`
          : "no provider is currently eligible";
    const message = providerName
      ? previous
        ? previousState && !previousState.healthy
          ? `${previous} unhealthy, switched to ${providerName}.`
          : `Switched from ${previous} to ${providerName}.`
        : `Activated ${providerName}.`
      : `No active provider is currently eligible.`;

    this.latestFailover = {
      previousProviderName: previous,
      nextProviderName: providerName,
      message,
      reason,
      createdAt: this.lastActiveSwitchAt,
    };

    this.pushEvent(
      providerName ? "info" : "warn",
      "active-provider-switch",
      message,
      providerName,
      {
        previous,
        next: providerName,
        reason,
      },
    );
  }

  noteEvent(
    level: EventLevel,
    type: string,
    message: string,
    providerName: string | null,
    details?: Record<string, unknown>,
  ) {
    this.pushEvent(level, type, message, providerName, details);
  }

  listEvents(limit = 50): EventEntry[] {
    return this.events.slice(0, limit);
  }

  listRouteLog(limit = 50): RouteLogEntry[] {
    return this.routeLog.slice(0, limit);
  }

  getHistory(windowMs = 5 * 60_000, limit = 160) {
    const cutoff = Date.now() - windowMs;
    const result: Record<string, ProviderHistoryPoint[]> = {};

    for (const [providerName, history] of this.history.entries()) {
      const filtered = history.filter(
        (point) => new Date(point.createdAt).getTime() >= cutoff,
      );
      result[providerName] = filtered.slice(-limit);
    }

    return result;
  }

  getSnapshot() {
    const providers = this.listProviders();
    const bestProvider = providers.find((provider) => provider.active) ?? null;
    const chainTip = this.getChainTip();

    return {
      providerCount: providers.length,
      healthyProviderCount: providers.filter((provider) => provider.healthy).length,
      chainTip,
      bestProvider,
      providers,
      monitorMode: this.activeMonitorMode,
      lastActiveSwitchAt: this.lastActiveSwitchAt,
      latestFailover: this.latestFailover,
      routingMode: this.runtimeSettings.mode,
      routingRules: this.runtimeSettings.rules,
    };
  }

  getMetrics() {
    const providers = this.listProviders();
    const routeCount = this.routeLog.length;
    const successRouteCount = this.routeLog.filter(
      (route) => route.status === "success",
    ).length;
    const failedRouteCount = routeCount - successRouteCount;
    const averageDurationMs =
      routeCount === 0
        ? null
        : Math.round(
            this.routeLog.reduce((sum, route) => sum + route.durationMs, 0) /
              routeCount,
          );
    const successRate =
      routeCount === 0
        ? null
        : Number(((successRouteCount / routeCount) * 100).toFixed(1));
    const routeProviderCounts = this.routeLog.reduce<Record<string, number>>(
      (accumulator, route) => {
        const providerName = route.providerName ?? "none";
        accumulator[providerName] = (accumulator[providerName] ?? 0) + 1;
        return accumulator;
      },
      {},
    );
    const methodCountByStrategy = this.routeLog.reduce<Record<string, number>>(
      (accumulator, route) => {
        const key = route.strategy ?? "unknown";
        accumulator[key] = (accumulator[key] ?? 0) + 1;
        return accumulator;
      },
      { read: 0, "fresh-read": 0, write: 0, unknown: 0 },
    );

    return {
      providerCount: providers.length,
      totalSuccessCount: providers.reduce((sum, provider) => sum + provider.successCount, 0),
      totalErrorCount: providers.reduce((sum, provider) => sum + provider.errorCount, 0),
      totalTimeoutCount: providers.reduce((sum, provider) => sum + provider.timeoutCount, 0),
      providerSwitchCount: this.providerSwitchCount,
      routeCount,
      successRouteCount,
      failedRouteCount,
      successRate,
      averageDurationMs,
      routeProviderCounts,
      methodCountByStrategy,
      monitorMode: this.activeMonitorMode,
      smartMode: this.runtimeSettings.mode,
      providers,
    };
  }

  getRuntimeSettings() {
    return {
      ...this.runtimeSettings,
      providerCosts: Object.fromEntries(
        [...this.providers.values()].map((provider) => [provider.name, provider.costScore]),
      ),
      availableFallbackProviders: this.getAvailableFallbackProviders(),
    };
  }

  updateRuntimeSettings(update: RuntimeSettingsUpdate) {
    if (update.mode) {
      this.runtimeSettings.mode = update.mode;
      if (update.mode !== "custom") {
        this.runtimeSettings.rules = buildRulesForMode(
          update.mode,
          this.runtimeSettings.rules.fallbackProvider,
        );
      }
    }

    if (update.rules) {
      this.runtimeSettings.mode = "custom";
      this.runtimeSettings.rules = {
        ...this.runtimeSettings.rules,
        ...update.rules,
      };
    }

    if (update.providerCosts) {
      for (const [providerName, costScore] of Object.entries(update.providerCosts)) {
        const provider = this.providers.get(providerName);
        if (!provider || !Number.isFinite(costScore)) {
          continue;
        }

        provider.costScore = Math.max(0, costScore);
      }
    }

    if (update.alerts) {
      this.runtimeSettings.alerts = {
        ...this.runtimeSettings.alerts,
        ...update.alerts,
        telegramWebhookUrl: normalizeWebhookUrl(
          update.alerts.telegramWebhookUrl ?? this.runtimeSettings.alerts.telegramWebhookUrl,
        ),
        discordWebhookUrl: normalizeWebhookUrl(
          update.alerts.discordWebhookUrl ?? this.runtimeSettings.alerts.discordWebhookUrl,
        ),
      };
    }

    if (
      this.runtimeSettings.rules.fallbackProvider &&
      !this.providers.has(this.runtimeSettings.rules.fallbackProvider)
    ) {
      this.runtimeSettings.rules.fallbackProvider = this.getDefaultFallbackProvider();
    }

    this.recomputeScores();
    this.pushEvent(
      "info",
      "routing-settings-updated",
      `Routing settings updated to ${this.runtimeSettings.mode} mode`,
      null,
      {
        mode: this.runtimeSettings.mode,
        rules: this.runtimeSettings.rules,
      },
    );

    return this.getRuntimeSettings();
  }

  private getDefaultFallbackProvider(): string | null {
    return (
      [...this.providers.values()].find((provider) => provider.tags.includes("public"))?.name ??
      [...this.providers.values()].find((provider) => provider.tags.includes("fallback"))?.name ??
      null
    );
  }

  private getAvailableFallbackProviders() {
    return [...this.providers.values()].map((provider) => provider.name);
  }

  private getPreferenceForStrategy(strategy: MethodStrategy): RoutingPreference {
    if (strategy === "write") {
      return this.runtimeSettings.rules.write;
    }

    if (strategy === "fresh-read") {
      return this.runtimeSettings.rules.freshRead;
    }

    return this.runtimeSettings.rules.read;
  }

  private getChainTip(): number | null {
    let chainTip: number | null = null;

    for (const provider of this.providers.values()) {
      if (provider.lastKnownSlot === null) {
        continue;
      }

      chainTip =
        chainTip === null
          ? provider.lastKnownSlot
          : Math.max(chainTip, provider.lastKnownSlot);
    }

    return chainTip;
  }

  private refreshStaleness() {
    const now = Date.now();

    for (const provider of this.providers.values()) {
      if (!provider.lastUpdatedAt) {
        continue;
      }

      const age = now - new Date(provider.lastUpdatedAt).getTime();

      if (age > this.staleAfterMs && provider.healthy) {
        provider.healthy = false;
        provider.lastError = "Provider health data became stale";
        this.pushEvent(
          "warn",
          "provider-stale",
          `${provider.name} has not reported health for ${age}ms`,
          provider.name,
          {
            staleAfterMs: this.staleAfterMs,
            age,
          },
        );
      }
    }

    this.recomputeScores();
  }

  private recomputeScores() {
    const chainTip = this.getChainTip();
    const displayPreference = this.runtimeSettings.rules.read;

    for (const provider of this.providers.values()) {
      if (chainTip === null || provider.lastKnownSlot === null) {
        provider.slotLag = null;
        provider.score = null;
        continue;
      }

      provider.slotLag = Math.max(0, chainTip - provider.lastKnownSlot);
      provider.score = computeProviderScore(provider, displayPreference);
      this.recordHistoryPoint(provider);
    }
  }

  private recordHistoryPoint(provider: ProviderState) {
    const history = this.history.get(provider.name);

    if (!history) {
      return;
    }

    const point: ProviderHistoryPoint = {
      createdAt: new Date().toISOString(),
      slotLag: provider.slotLag,
      score: provider.score,
      lastKnownSlot: provider.lastKnownSlot,
      latencyMs: provider.avgLatencyMs,
      errorRate: Number((getProviderErrorRate(provider) * 100).toFixed(2)),
      healthy: provider.healthy,
    };
    const previous = history[history.length - 1];

    if (
      previous &&
      previous.slotLag === point.slotLag &&
      previous.score === point.score &&
      previous.lastKnownSlot === point.lastKnownSlot &&
      previous.latencyMs === point.latencyMs &&
      previous.errorRate === point.errorRate &&
      previous.healthy === point.healthy
    ) {
      return;
    }

    history.push(point);

    if (history.length > ProviderStore.HISTORY_LIMIT) {
      history.splice(0, history.length - ProviderStore.HISTORY_LIMIT);
    }
  }

  private pushEvent(
    level: EventLevel,
    type: string,
    message: string,
    providerName: string | null,
    details?: Record<string, unknown>,
  ) {
    const event: EventEntry = {
      id: this.nextEventId,
      level,
      type,
      providerName,
      message,
      createdAt: new Date().toISOString(),
      details,
    };

    this.nextEventId += 1;
    this.events.unshift(event);
    trimToLimit(this.events, this.eventLogLimit);
    this.dispatchAlert(event);
  }

  private dispatchAlert(event: EventEntry) {
    const shouldNotify =
      (event.type === "provider-stale" && this.runtimeSettings.alerts.notifyOnProviderStale) ||
      (event.type === "active-provider-switch" && this.runtimeSettings.alerts.notifyOnFailover);

    if (!shouldNotify) {
      return;
    }

    const message = `[RouteX] ${event.message} (${event.type}) at ${event.createdAt}`;
    const telegramWebhookUrl = this.runtimeSettings.alerts.telegramWebhookUrl;
    const discordWebhookUrl = this.runtimeSettings.alerts.discordWebhookUrl;

    if (telegramWebhookUrl) {
      void fetch(telegramWebhookUrl, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ text: message }),
      }).catch((error) => {
        console.warn("RouteX telegram alert failed", error);
      });
    }

    if (discordWebhookUrl) {
      void fetch(discordWebhookUrl, {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ content: message }),
      }).catch((error) => {
        console.warn("RouteX discord alert failed", error);
      });
    }
  }
}
