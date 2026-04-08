export type MonitorMode = "rpc" | "yellowstone";
export type EventLevel = "info" | "warn" | "error";
export type MethodStrategy = "read" | "fresh-read" | "write";
export type RoutingPreference = "fastest" | "freshest" | "cheapest";
export type SmartMode = RoutingPreference | "custom";
export type DemoScenario =
  | "provider-failure"
  | "latency-spike"
  | "stale-slot-lag"
  | "reset";

export type ApiProvider = {
  name: string;
  rpcUrl: string;
  cluster: string;
  yellowstoneUrl?: string;
  lastKnownSlot: number | null;
  slotLag: number | null;
  avgLatencyMs: number | null;
  lastLatencyMs: number | null;
  successCount: number;
  errorCount: number;
  timeoutCount: number;
  consecutiveFailures: number;
  lastError: string | null;
  lastUpdatedAt: string | null;
  lastHealthyAt: string | null;
  lastRoutedAt: string | null;
  healthy: boolean;
  active: boolean;
  score: number | null;
  writeEnabled: boolean;
  priorityBias: number;
  costScore: number;
  tags: string[];
  monitorSource: "rpc" | "yellowstone" | "none";
};

export type RoutingRules = {
  read: RoutingPreference;
  freshRead: RoutingPreference;
  write: RoutingPreference;
  fallbackProvider: string | null;
};

export type AlertSettings = {
  telegramWebhookUrl: string | null;
  discordWebhookUrl: string | null;
  notifyOnProviderStale: boolean;
  notifyOnFailover: boolean;
};

export type SettingsResponse = {
  mode: SmartMode;
  rules: RoutingRules;
  alerts: AlertSettings;
  providerCosts: Record<string, number>;
  availableFallbackProviders: string[];
};

export type RouteCandidateSnapshot = {
  providerName: string;
  routeScore: number | null;
  preference: RoutingPreference;
  latencyMs: number | null;
  slotLag: number | null;
  costScore: number;
  healthy: boolean;
  active: boolean;
};

export type RouteExplanation = {
  summary: string;
  mode: SmartMode;
  preference: RoutingPreference;
  reasons: string[];
  fallbackProvider: string | null;
  strictMaxSlotLag: number | null;
  policyRelaxed: boolean;
  candidateSnapshot: RouteCandidateSnapshot[];
};

export type FailoverBanner = {
  previousProviderName: string | null;
  nextProviderName: string | null;
  message: string;
  reason: string;
  createdAt: string;
};

export type HealthResponse = {
  ok: boolean;
  providerCount: number;
  healthyProviderCount: number;
  chainTip: number | null;
  bestProvider: ApiProvider | null;
  providers: ApiProvider[];
  monitorMode: MonitorMode;
  lastActiveSwitchAt: string | null;
  latestFailover: FailoverBanner | null;
  routingMode: SmartMode;
  routingRules: RoutingRules;
};

export type MetricsResponse = {
  providerCount: number;
  totalSuccessCount: number;
  totalErrorCount: number;
  totalTimeoutCount: number;
  providerSwitchCount: number;
  routeCount: number;
  successRouteCount: number;
  failedRouteCount: number;
  successRate: number | null;
  averageDurationMs: number | null;
  routeProviderCounts: Record<string, number>;
  methodCountByStrategy: Record<string, number>;
  monitorMode: MonitorMode;
  smartMode: SmartMode;
  providers: ApiProvider[];
};

export type RouteLogEntry = {
  id: number;
  requestId: string;
  method: string;
  strategy: MethodStrategy;
  providerName: string | null;
  attemptedProviders: string[];
  attempts: number;
  status: "success" | "failed";
  durationMs: number;
  errorMessage: string | null;
  createdAt: string;
  mode: SmartMode;
  explanation: RouteExplanation | null;
};

export type EventEntry = {
  id: number;
  level: EventLevel;
  type: string;
  providerName: string | null;
  message: string;
  createdAt: string;
  details?: Record<string, unknown>;
};

export type ProviderHistoryPoint = {
  createdAt: string;
  slotLag: number | null;
  score: number | null;
  lastKnownSlot: number | null;
  latencyMs: number | null;
  errorRate: number;
  healthy: boolean;
};

export type HistoryResponse = Record<string, ProviderHistoryPoint[]>;

export type DemoBehavior = {
  lagSlots: number;
  latencyMs: number;
  errorRate: number;
  writeFailureRate: number;
  enabled: boolean;
};

export type DemoProviderState = {
  name: string;
  available: boolean;
  adminUrl: string;
  currentSlot: number | null;
  chainTip: number | null;
  behavior: DemoBehavior | null;
  error: string | null;
};

export type DemoStatus = {
  available: boolean;
  providers: DemoProviderState[];
};

export type ProviderView = {
  id: string;
  name: string;
  latency: number | null;
  lag: number | null;
  routes: number;
  score: number | null;
  costScore: number;
  color: string;
  colorHsl: string;
  active: boolean;
  healthy: boolean;
  lastError: string | null;
};

export type TrafficLogView = {
  id: string;
  timestamp: string;
  method: string;
  provider: string;
  status: "success" | "failed";
};

export type SystemEventView = {
  id: string;
  timestamp: string;
  type: "info" | "warning" | "error";
  message: string;
};

type ProviderColor = {
  hex: string;
  hsl: string;
};

const providerPalette: ProviderColor[] = [
  { hex: "#f5f5f5", hsl: "0 0% 96%" },
  { hex: "#cfcfcf", hsl: "0 0% 81%" },
  { hex: "#9b9b9b", hsl: "0 0% 61%" },
  { hex: "#767676", hsl: "0 0% 46%" },
  { hex: "#565656", hsl: "0 0% 34%" },
];

const apiBase = (import.meta.env.VITE_ROUTEX_API_BASE ?? "").replace(/\/$/, "");

function apiUrl(path: string) {
  if (apiBase) {
    return `${apiBase}${path}`;
  }

  return path;
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(apiUrl(path), init);

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `${response.status} ${response.statusText}`);
  }

  return (await response.json()) as T;
}

export async function fetchDashboardSnapshot() {
  const [health, metrics, events, routes, history, settings, demo] = await Promise.all([
    apiFetch<HealthResponse>("/api/health"),
    apiFetch<MetricsResponse>("/api/metrics"),
    apiFetch<EventEntry[]>("/api/events"),
    apiFetch<RouteLogEntry[]>("/api/routes"),
    apiFetch<HistoryResponse>("/api/history"),
    apiFetch<SettingsResponse>("/api/settings"),
    apiFetch<DemoStatus>("/api/demo"),
  ]);

  return { health, metrics, events, routes, history, settings, demo };
}

export async function updateSettings(payload: {
  mode?: SmartMode;
  rules?: Partial<RoutingRules>;
  providerCosts?: Record<string, number>;
  alerts?: Partial<AlertSettings>;
}) {
  return apiFetch<SettingsResponse>("/api/settings", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
  });
}

export async function triggerDemoScenario(scenario: DemoScenario) {
  return apiFetch<{ ok: true; status: DemoStatus }>("/api/demo", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({ scenario }),
  });
}

export async function sendRpc(payload: unknown) {
  const startedAt = performance.now();
  const response = await fetch(apiUrl("/rpc"), {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const durationMs = Math.round(performance.now() - startedAt);
  const body = await response.json();

  if (!response.ok) {
    const message =
      body?.error?.message ??
      body?.message ??
      `${response.status} ${response.statusText}`;
    throw new Error(message);
  }

  return {
    body,
    durationMs,
    provider: response.headers.get("x-routex-provider") ?? "unknown",
    attempts: response.headers.get("x-routex-attempts"),
    strategy: response.headers.get("x-routex-strategy"),
    mode: response.headers.get("x-routex-mode"),
    preference: response.headers.get("x-routex-preference"),
    explanation: response.headers.get("x-routex-explanation"),
  };
}

function getProviderColor(name: string, index: number): ProviderColor {
  const lower = name.toLowerCase();

  if (lower.includes("rpcfast") || lower.includes("alpha")) {
    return providerPalette[0];
  }

  if (lower.includes("quicknode") || lower.includes("beta")) {
    return providerPalette[1];
  }

  if (lower.includes("helius") || lower.includes("gamma")) {
    return providerPalette[2];
  }

  if (lower.includes("solana-public")) {
    return providerPalette[3];
  }

  return providerPalette[index % providerPalette.length];
}

export function toProviderViews(
  providers: ApiProvider[],
  routeCounts: Record<string, number>,
  activeProviderName?: string | null,
): ProviderView[] {
  return providers.map((provider, index) => {
    const color = getProviderColor(provider.name, index);

    return {
      id: provider.name,
      name: provider.name,
      latency: provider.avgLatencyMs,
      lag: provider.slotLag,
      routes: routeCounts[provider.name] ?? 0,
      score: provider.score,
      costScore: provider.costScore,
      color: color.hex,
      colorHsl: color.hsl,
      active:
        activeProviderName !== undefined
          ? provider.name === activeProviderName
          : provider.active,
      healthy: provider.healthy,
      lastError: provider.lastError,
    };
  });
}

export function toTrafficLogViews(routes: RouteLogEntry[]): TrafficLogView[] {
  return routes.map((route) => ({
    id: String(route.id),
    timestamp: formatTime(route.createdAt),
    method: route.method,
    provider: route.providerName ?? "none",
    status: route.status,
  }));
}

export function toSystemEventViews(events: EventEntry[]): SystemEventView[] {
  return events.map((event) => ({
    id: String(event.id),
    timestamp: formatTime(event.createdAt),
    type:
      event.level === "warn"
        ? "warning"
        : event.level === "error"
          ? "error"
          : "info",
    message: `${event.type}: ${event.message}`,
  }));
}

export function formatTime(value: string) {
  return new Date(value).toLocaleTimeString("en-US", {
    hour12: true,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function relativeTimeFromIso(value: string | null) {
  if (!value) {
    return null;
  }

  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) {
    return null;
  }

  const seconds = Math.max(0, Math.round((Date.now() - timestamp) / 1000));

  if (seconds < 60) {
    return `${seconds}s ago`;
  }

  if (seconds < 3600) {
    return `${Math.round(seconds / 60)}m ago`;
  }

  return `${Math.round(seconds / 3600)}h ago`;
}
