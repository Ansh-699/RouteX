import {
  DemoProviderState,
  DemoScenario,
  DemoStatus,
  ProviderState,
} from "./types.js";

type DemoAdminStateResponse = {
  provider?: string;
  chainTip?: number;
  currentSlot?: number;
  behavior?: DemoProviderState["behavior"];
};

function isLocalRpcUrl(value: string): boolean {
  return (
    value.startsWith("http://127.0.0.1:") ||
    value.startsWith("http://localhost:") ||
    value.startsWith("https://127.0.0.1:")
  );
}

function isDemoProvider(provider: ProviderState): boolean {
  return provider.tags.includes("demo") || isLocalRpcUrl(provider.rpcUrl);
}

function getAdminBaseUrl(provider: ProviderState): string {
  return `${provider.rpcUrl.replace(/\/$/, "")}/admin`;
}

async function getDemoProviderState(
  provider: ProviderState,
): Promise<DemoProviderState> {
  const adminUrl = getAdminBaseUrl(provider);

  try {
    const response = await fetch(`${adminUrl}/state`);
    if (!response.ok) {
      throw new Error(`Demo admin returned HTTP ${response.status}`);
    }

    const body = (await response.json()) as DemoAdminStateResponse;
    return {
      name: provider.name,
      available: true,
      adminUrl,
      currentSlot:
        typeof body.currentSlot === "number" ? body.currentSlot : provider.lastKnownSlot,
      chainTip: typeof body.chainTip === "number" ? body.chainTip : null,
      behavior: body.behavior ?? null,
      error: null,
    };
  } catch (error) {
    return {
      name: provider.name,
      available: false,
      adminUrl,
      currentSlot: provider.lastKnownSlot,
      chainTip: null,
      behavior: null,
      error: error instanceof Error ? error.message : "Unknown demo admin error",
    };
  }
}

async function postAdmin(
  provider: ProviderState,
  path: string,
  body?: Record<string, unknown>,
) {
  const response = await fetch(`${getAdminBaseUrl(provider)}${path}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify(body ?? {}),
  });

  if (!response.ok) {
    throw new Error(`Demo admin for ${provider.name} returned HTTP ${response.status}`);
  }
}

function pickScenarioTarget(
  providers: ProviderState[],
  activeProviderName: string | null,
): ProviderState | null {
  return (
    providers.find((provider) => provider.name === activeProviderName) ??
    providers.find((provider) => provider.healthy) ??
    providers[0] ??
    null
  );
}

export async function getDemoStatus(
  providers: ProviderState[],
): Promise<DemoStatus> {
  const demoProviders = providers.filter(isDemoProvider);

  if (demoProviders.length === 0) {
    return {
      available: false,
      providers: [],
    };
  }

  const states = await Promise.all(demoProviders.map(getDemoProviderState));

  return {
    available: states.some((provider) => provider.available),
    providers: states,
  };
}

export async function applyDemoScenario(
  providers: ProviderState[],
  scenario: DemoScenario,
  activeProviderName: string | null,
) {
  const demoProviders = providers.filter(isDemoProvider);

  if (demoProviders.length === 0) {
    throw new Error("No demo-capable providers are configured");
  }

  if (scenario === "reset") {
    await Promise.all(
      demoProviders.map((provider) => postAdmin(provider, "/reset")),
    );
    return getDemoStatus(providers);
  }

  const target = pickScenarioTarget(demoProviders, activeProviderName);

  if (!target) {
    throw new Error("No demo provider is available for the requested scenario");
  }

  switch (scenario) {
    case "provider-failure":
      await postAdmin(target, "/behavior", {
        enabled: false,
        errorRate: 1,
        writeFailureRate: 1,
      });
      break;
    case "latency-spike":
      await postAdmin(target, "/behavior", {
        enabled: true,
        latencyMs: 900,
      });
      break;
    case "stale-slot-lag":
      await postAdmin(target, "/behavior", {
        enabled: true,
        lagSlots: 24,
      });
      break;
    default:
      break;
  }

  return getDemoStatus(providers);
}
