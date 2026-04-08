import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ProviderView } from "@/lib/routex-api";

interface ProvidersTableProps {
  providers: ProviderView[];
}

export function ProvidersTable({ providers }: ProvidersTableProps) {
  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="micro-label text-xs">Providers</CardTitle>
      </CardHeader>
      <CardContent className="p-3 pt-0">
        <table className="w-full text-sm font-mono">
          <thead>
            <tr className="text-muted-foreground text-[10px] uppercase tracking-wider">
              <th className="text-left pb-2 pr-2"></th>
              <th className="text-left pb-2 pr-3">Name</th>
              <th className="text-right pb-2 pr-3">Latency</th>
              <th className="text-right pb-2 pr-3">Lag</th>
              <th className="text-right pb-2 pr-3">Routes</th>
              <th className="text-right pb-2 pr-3">Cost</th>
              <th className="text-right pb-2">Score</th>
            </tr>
          </thead>
          <tbody>
            {providers.map((p) => (
              <tr
                key={p.id}
                className={`border-t border-border/50 ${p.active ? 'bg-accent/50' : 'hover:bg-accent/30'} transition-colors`}
              >
                <td className="py-2.5 pr-2">
                  <div
                    className={`w-2 h-2 rounded-full ${p.active ? 'ring-2 ring-foreground/20' : ''}`}
                    style={{ backgroundColor: p.healthy ? p.color : "rgba(148, 163, 184, 0.35)" }}
                  />
                </td>
                <td className="py-2.5 pr-3 font-medium text-foreground text-xs">
                  {p.name}
                  {p.active && (
                    <span className="ml-2 text-[9px] uppercase tracking-wider text-muted-foreground bg-accent px-1.5 py-0.5 rounded">
                      active
                    </span>
                  )}
                </td>
                <td className="py-2.5 pr-3 text-right tabular-nums text-muted-foreground text-xs">
                  {p.latency === null ? "—" : `${Math.round(p.latency)}ms`}
                </td>
                <td className="py-2.5 pr-3 text-right tabular-nums text-muted-foreground text-xs">
                  {p.lag ?? "—"}
                </td>
                <td className="py-2.5 pr-3 text-right tabular-nums text-muted-foreground text-xs">
                  {p.routes}
                </td>
                <td className="py-2.5 pr-3 text-right tabular-nums text-muted-foreground text-xs">
                  {p.costScore.toFixed(1)}
                </td>
                <td className="py-2.5 text-right tabular-nums font-semibold text-foreground text-xs">
                  {p.score === null ? "—" : p.score.toFixed(1)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}
