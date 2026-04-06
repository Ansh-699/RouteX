import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { HealthResponse, MetricsResponse, ProviderView } from "@/lib/routex-api";

interface SelectionRationaleProps {
  health: HealthResponse | null;
  metrics: MetricsResponse | null;
  providers: ProviderView[];
}

export function SelectionRationale({
  health,
  metrics,
  providers,
}: SelectionRationaleProps) {
  const active =
    providers.find((provider) => provider.active) ??
    providers[0];
  const sorted = [...providers].sort((a, b) => {
    const left = a.score ?? Number.POSITIVE_INFINITY;
    const right = b.score ?? Number.POSITIVE_INFINITY;
    return left - right;
  });
  const runnerUp = sorted.find((provider) => provider.id !== active?.id);
  const activeHealth = health?.bestProvider ?? null;
  const trafficShare =
    active && metrics && metrics.routeCount > 0
      ? Math.round(((metrics.routeProviderCounts[active.name] ?? 0) / metrics.routeCount) * 100)
      : 0;
  const delta =
    active?.score !== null && active?.score !== undefined && runnerUp?.score !== null && runnerUp?.score !== undefined
      ? (runnerUp.score - active.score).toFixed(1)
      : "—";
  const methodMix = metrics?.methodCountByStrategy ?? { read: 0, "fresh-read": 0, write: 0 };

  if (!active) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="micro-label text-xs">Selection Rationale</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground font-mono">
          Waiting for provider health data...
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="micro-label text-xs">Selection Rationale</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-baseline gap-2">
          <span className="text-xs text-muted-foreground font-mono">Primary:</span>
          <span className="font-mono font-bold text-foreground text-lg">{active.name}</span>
        </div>

        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Latency', value: active.latency === null ? "—" : `${Math.round(active.latency)}ms` },
            { label: 'Slot Lag', value: `${active.lag ?? "—"}` },
            { label: 'Score', value: active.score === null ? "—" : active.score.toFixed(1) },
          ].map(m => (
            <div key={m.label}>
              <div className="micro-label mb-1">{m.label}</div>
              <div className="font-mono text-sm font-semibold text-foreground">{m.value}</div>
            </div>
          ))}
        </div>

        <div className="border-t pt-3 grid grid-cols-2 gap-3">
          <div>
            <div className="micro-label mb-1">Traffic Share</div>
            <div className="font-mono text-sm text-foreground">{trafficShare}%</div>
          </div>
          <div>
            <div className="micro-label mb-1">Next Best Δ</div>
            <div className="font-mono text-sm text-foreground">+{delta}</div>
          </div>
        </div>

        {activeHealth?.lastError && (
          <div className="border-t pt-3">
            <div className="micro-label mb-1">Last Error</div>
            <div className="font-mono text-xs text-muted-foreground">{activeHealth.lastError}</div>
          </div>
        )}

        <div className="border-t pt-3">
          <div className="micro-label mb-2">Method Mix</div>
          <div className="flex gap-2 flex-wrap">
            {[
              { label: "read", count: methodMix.read ?? 0 },
              { label: "fresh-read", count: methodMix["fresh-read"] ?? 0 },
              { label: "write", count: methodMix.write ?? 0 },
            ].map(m => (
              <div key={m.label} className="bg-secondary rounded-md px-2.5 py-1 text-xs font-mono">
                <span className="text-muted-foreground">{m.label}</span>
                <span className="ml-1.5 text-foreground font-semibold">{m.count}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
