import { Activity, Gauge, TimerReset } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { HistoryResponse, ProviderView } from "@/lib/routex-api";

interface HistoryMiniChartsProps {
  history: HistoryResponse;
  providers: ProviderView[];
}

type MetricKey = "latencyMs" | "slotLag" | "errorRate";

type ChartPoint = {
  index: number;
  label: string;
  value: number;
};

function buildAggregateSeries(
  history: HistoryResponse,
  metric: MetricKey,
): ChartPoint[] {
  const entries = Object.values(history);
  const maxLength = Math.max(0, ...entries.map((points) => points.length));

  return Array.from({ length: maxLength })
    .map((_, index) => {
      const samples = entries
        .map((points) => points[points.length - maxLength + index])
        .filter(Boolean);
      const numericValues = samples
        .map((point) => point?.[metric])
        .filter((value): value is number => typeof value === "number");

      if (numericValues.length === 0) {
        return null;
      }

      const timestamp = samples.find((point) => point?.createdAt)?.createdAt ?? "";

      return {
        index,
        label: timestamp ? new Date(timestamp).toLocaleTimeString("en-US", {
          minute: "2-digit",
          second: "2-digit",
        }) : `${index}`,
        value: Number(
          (
            numericValues.reduce((sum, value) => sum + value, 0) /
            numericValues.length
          ).toFixed(metric === "errorRate" ? 2 : 1),
        ),
      };
    })
    .filter((point): point is ChartPoint => point !== null);
}

function formatMetric(metric: MetricKey, value: number | undefined) {
  if (value === undefined) {
    return "—";
  }

  if (metric === "latencyMs") {
    return `${Math.round(value)}ms`;
  }

  if (metric === "errorRate") {
    return `${value.toFixed(1)}%`;
  }

  return `${value.toFixed(1)} slots`;
}

export function HistoryMiniCharts({
  history,
  providers,
}: HistoryMiniChartsProps) {
  const activeProvider =
    providers.find((provider) => provider.active) ?? providers[0] ?? null;

  const cards: Array<{
    key: MetricKey;
    title: string;
    icon: typeof Activity;
    color: string;
    current: string;
  }> = [
    {
      key: "latencyMs",
      title: "Latency · last 5 min",
      icon: Gauge,
      color: "#f5f5f5",
      current: activeProvider?.latency === null || activeProvider?.latency === undefined
        ? "—"
        : `${Math.round(activeProvider.latency)}ms`,
    },
    {
      key: "slotLag",
      title: "Slot Lag · last 5 min",
      icon: TimerReset,
      color: "#9a9a9a",
      current: activeProvider?.lag === null || activeProvider?.lag === undefined
        ? "—"
        : `${activeProvider.lag}`,
    },
    {
      key: "errorRate",
      title: "Error Rate · last 5 min",
      icon: Activity,
      color: "#6d6d6d",
      current: activeProvider
        ? `${(
            ((activeProvider.lastError ? 1 : 0) /
              Math.max(1, activeProvider.routes || 1)) *
            100
          ).toFixed(1)}%`
        : "—",
    },
  ];

  return (
    <div className="mb-4 grid gap-4 lg:grid-cols-3">
      {cards.map((card) => {
        const data = buildAggregateSeries(history, card.key);
        const latest = data[data.length - 1]?.value;

        return (
          <Card key={card.key}>
            <CardHeader className="pb-2">
              <CardTitle className="micro-label text-xs">{card.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <card.icon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">
                    {formatMetric(card.key, latest)}
                  </span>
                </div>
                <div className="text-xs font-mono text-muted-foreground">
                  active {card.current}
                </div>
              </div>

              <div className="h-32">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data}>
                    <defs>
                      <linearGradient id={`fill-${card.key}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={card.color} stopOpacity={0.32} />
                        <stop offset="95%" stopColor={card.color} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} stroke="hsl(var(--border))" strokeOpacity={0.3} />
                    <XAxis
                      dataKey="label"
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 10 }}
                      minTickGap={24}
                    />
                    <YAxis hide />
                    <Tooltip
                      contentStyle={{
                        borderRadius: 12,
                        border: "1px solid hsl(var(--border))",
                        background: "hsl(var(--background))",
                      }}
                      formatter={(value: number) => formatMetric(card.key, value)}
                    />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke={card.color}
                      fill={`url(#fill-${card.key})`}
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
