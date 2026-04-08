export type JsonRpcId = string | number | null;

export type JsonRpcRequest = {
  jsonrpc?: string;
  id?: JsonRpcId;
  method: string;
  params?: unknown[] | Record<string, unknown>;
};

export type JsonRpcBatchRequest = JsonRpcRequest[];

export type JsonRpcError = {
  code: number;
  message: string;
  data?: unknown;
};

export type JsonRpcResponse = {
  jsonrpc: string;
  id?: JsonRpcId;
  result?: unknown;
  error?: JsonRpcError;
};

export type JsonRpcBatchResponse = JsonRpcResponse[];

export type MonitorMode = "rpc" | "yellowstone";
export type MonitorSource = "rpc" | "yellowstone" | "none";
export type MethodStrategy = "read" | "fresh-read" | "write";
export type EventLevel = "info" | "warn" | "error";
export type RoutingPreference = "fastest" | "freshest" | "cheapest";
export type SmartMode = RoutingPreference | "custom";
export type DemoScenario =
  | "provider-failure"
  | "latency-spike"
  | "stale-slot-lag"
  | "reset";

export type ProviderConfig = {
  name: string;
  rpcUrl: string;
  rpcHeaders?: Record<string, string>;
  cluster?: string;
  yellowstoneUrl?: string;
  token?: string;
  writeEnabled?: boolean;
  priorityBias?: number;
  costScore?: number;
  tags?: string[];
};

export type ProviderState = {
  name: string;
  rpcUrl: string;
  rpcHeaders?: Record<string, string>;
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
  monitorSource: MonitorSource;
};

export type RequestAttempt = {
  providerName: string;
  durationMs: number;
  ok: boolean;
  timeout: boolean;
  errorMessage: string | null;
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

export type RuntimeSettings = {
  mode: SmartMode;
  rules: RoutingRules;
  alerts: AlertSettings;
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

export type RouteDecision = {
  provider: ProviderState;
  attempts: number;
  explanation: RouteExplanation;
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

export type ProviderHistoryPoint = {
  createdAt: string;
  slotLag: number | null;
  score: number | null;
  lastKnownSlot: number | null;
  latencyMs: number | null;
  errorRate: number;
  healthy: boolean;
};

export type RouteRecord = {
  requestId: string;
  method: string;
  strategy: MethodStrategy;
  providerName: string | null;
  attemptedProviders: string[];
  attempts: number;
  status: "success" | "failed";
  durationMs: number;
  errorMessage: string | null;
  mode: SmartMode;
  explanation: RouteExplanation | null;
};

export type ProviderCandidateOptions = {
  strategy: MethodStrategy;
  maxSlotLag: number | null;
  healthyOnly?: boolean;
};

export type ProviderCandidate = {
  provider: ProviderState;
  score: number | null;
  preference: RoutingPreference;
  snapshot: {
    latencyMs: number | null;
    slotLag: number | null;
    costScore: number;
    healthy: boolean;
    active: boolean;
  };
};

export type FailoverBanner = {
  previousProviderName: string | null;
  nextProviderName: string | null;
  message: string;
  reason: string;
  createdAt: string;
};

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

export type RouteXConfig = {
  host: string;
  port: number;
  monitorIntervalMs: number;
  requestTimeoutMs: number;
  maxSlotLagForWrites: number;
  maxSlotLagForFreshReads: number;
  staleAfterMs: number;
  routeLogLimit: number;
  eventLogLimit: number;
  monitorMode: MonitorMode;
  alerts: AlertSettings;
  providers: ProviderConfig[];
};
