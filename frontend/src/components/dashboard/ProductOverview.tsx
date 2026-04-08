import { Activity, ArrowRight, CircleAlert, Plug, Radio, Route, Server } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { HealthResponse, MetricsResponse } from "@/lib/routex-api";

interface ProductOverviewProps {
  health: HealthResponse | null;
  metrics: MetricsResponse | null;
  status: "connecting" | "live" | "error";
  activeProviderName: string | null;
}

export function ProductOverview({
  health,
  metrics,
  status,
  activeProviderName,
}: ProductOverviewProps) {
  const summaryCards = [
    {
      title: "Problem We Solve",
      description:
        "Solana apps often pin to one RPC. When that node falls behind, you get stale reads, failed writes, and no graceful recovery.",
      icon: CircleAlert,
    },
    {
      title: "Why RPCFast gRPC",
      description:
        "RouteX can consume RPCFast Yellowstone gRPC for sub-millisecond slot updates, then fall back to standard RPC polling for the rest of the provider set.",
      icon: Radio,
    },
    {
      title: "How Users Plug In",
      description:
        "Point your wallet adapter, SDK, or backend client to RouteX `/rpc`, and let the router choose the freshest healthy provider on each request.",
      icon: Plug,
    },
  ];

  const steps = [
    "Add your upstream RPC providers, with RPCFast Yellowstone gRPC enabled for the primary freshness signal.",
    "Send JSON-RPC requests to RouteX instead of a single direct Solana endpoint.",
    "Watch the dashboard to confirm slot freshness, failover decisions, and live routing performance.",
  ];

  const successRate =
    metrics?.successRate === null || metrics?.successRate === undefined
      ? "—"
      : `${metrics.successRate}%`;

  const liveState =
    status === "live"
      ? "Routing live"
      : status === "error"
        ? "Telemetry retrying"
        : "Connecting to backend";

  return (
    <section className="mb-6 space-y-4">
      <Card className="overflow-hidden border-foreground/10 bg-[linear-gradient(180deg,hsla(var(--foreground),0.03),hsla(var(--background),1)_55%)]">
        <CardContent className="p-6 sm:p-8">
          <div className="grid gap-6 xl:grid-cols-[1.35fr_0.9fr]">
            <div>
              <div className="micro-label mb-3">Freshness-aware Solana infrastructure</div>
              <h2 className="text-4xl sm:text-5xl font-black tracking-[-0.08em] font-mono text-foreground">
                ROUTE<span className="text-muted-foreground">X</span>
              </h2>
              <p className="mt-4 max-w-2xl text-sm sm:text-base leading-7 text-muted-foreground">
                RouteX is a smart Solana RPC router that sits between your app and multiple upstream
                providers. It uses RPCFast Yellowstone gRPC for ultra-fast slot freshness when
                available, combines that with latency and failure scoring, and automatically routes
                every request to the healthiest node.
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                <div className="rounded-full border bg-background/80 px-3 py-1 text-xs font-mono text-foreground">
                  Product: RouteX
                </div>
                <div className="rounded-full border bg-background/80 px-3 py-1 text-xs font-mono text-foreground">
                  RPCFast Yellowstone gRPC
                </div>
                <div className="rounded-full border bg-background/80 px-3 py-1 text-xs font-mono text-foreground">
                  Drop-in JSON-RPC proxy
                </div>
              </div>
            </div>

            <div className="grid gap-3">
              <div className="rounded-xl border bg-background/80 p-4">
                <div className="flex items-center gap-2">
                  <Route className="h-4 w-4 text-muted-foreground" />
                  <span className="micro-label">Live Route State</span>
                </div>
                <div className="mt-3 text-xl font-semibold text-foreground">
                  {activeProviderName ?? "Waiting for provider selection"}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {liveState} across {health?.providerCount ?? 0} monitored providers.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                <div className="rounded-xl border bg-background/80 p-4">
                  <div className="flex items-center gap-2">
                    <Server className="h-4 w-4 text-muted-foreground" />
                    <span className="micro-label">Freshness Signal</span>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    Healthy providers: <span className="font-semibold text-foreground">{health?.healthyProviderCount ?? 0}</span> /{" "}
                    <span className="font-semibold text-foreground">{health?.providerCount ?? 0}</span>
                  </p>
                </div>

                <div className="rounded-xl border bg-background/80 p-4">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-muted-foreground" />
                    <span className="micro-label">Recent Success</span>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    Success rate: <span className="font-semibold text-foreground">{successRate}</span> over the recent routing window.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-3">
        {summaryCards.map((card) => (
          <Card key={card.title} className="h-full">
            <CardContent className="p-5">
              <div className="flex items-center gap-2">
                <card.icon className="h-4 w-4 text-muted-foreground" />
                <span className="micro-label">{card.title}</span>
              </div>
              <p className="mt-4 text-sm leading-7 text-muted-foreground">{card.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="p-5 sm:p-6">
          <div className="flex items-center gap-2">
            <ArrowRight className="h-4 w-4 text-muted-foreground" />
            <span className="micro-label">How Users Can Use RouteX</span>
          </div>

          <div className="mt-4 grid gap-3 lg:grid-cols-3">
            {steps.map((step, index) => (
              <div key={step} className="rounded-xl border bg-background p-4">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full border text-xs font-bold font-mono">
                    0{index + 1}
                  </div>
                  <span className="micro-label">Step {index + 1}</span>
                </div>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">{step}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
