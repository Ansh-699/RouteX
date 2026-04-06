import { Card, CardContent } from "@/components/ui/card";
import { Activity, Server, Percent, Clock, ArrowRightLeft } from "lucide-react";
import type { HealthResponse, MetricsResponse } from "@/lib/routex-api";

interface MetricsHUDProps {
  health: HealthResponse | null;
  metrics: MetricsResponse | null;
}

export function MetricsHUD({ health, metrics }: MetricsHUDProps) {
  const items = [
    {
      label: "Monitor Mode",
      value: health?.monitorMode ?? "—",
      sub: "active",
      icon: Activity,
    },
    {
      label: "Healthy Nodes",
      value: `${health?.healthyProviderCount ?? 0}/${health?.providerCount ?? 0}`,
      sub: "online providers",
      icon: Server,
    },
    {
      label: "Success Rate",
      value: metrics?.successRate === null || metrics?.successRate === undefined
        ? "—"
        : `${metrics.successRate}%`,
      sub: "last 2 min",
      icon: Percent,
    },
    {
      label: "Avg Latency",
      value: `${metrics?.averageDurationMs ?? 0} ms`,
      sub: "rolling",
      icon: Clock,
    },
    {
      label: "Routes",
      value: (metrics?.routeCount ?? 0).toLocaleString(),
      sub: "total handled",
      icon: ArrowRightLeft,
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
      {items.map((m) => (
        <Card key={m.label} className="hover:bg-accent/50 transition-colors cursor-default">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <m.icon className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="micro-label">{m.label}</span>
            </div>
            <div className="metric-value">{m.value}</div>
            <div className="text-xs text-muted-foreground mt-1 font-mono">{m.sub}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
