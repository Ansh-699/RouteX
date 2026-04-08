import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { RouteLogEntry } from "@/lib/routex-api";
import { formatTime } from "@/lib/routex-api";

interface RoutingExplanationPanelProps {
  routes: RouteLogEntry[];
}

export function RoutingExplanationPanel({
  routes,
}: RoutingExplanationPanelProps) {
  const items = routes.slice(0, 6);

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="micro-label text-xs">Routing Explanation</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.length === 0 ? (
          <div className="text-sm font-mono text-muted-foreground">
            Waiting for recent routes...
          </div>
        ) : (
          items.map((route) => (
            <div
              key={route.id}
              className="rounded-xl border bg-background p-3"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="text-sm font-medium text-foreground">{route.method}</div>
                <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                  {formatTime(route.createdAt)}
                </div>
              </div>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                {route.explanation?.summary ?? "No explanation captured for this request."}
              </p>
              <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-mono">
                <span className="rounded-full border bg-secondary px-2 py-1 text-foreground">
                  mode {route.mode}
                </span>
                <span className="rounded-full border bg-secondary px-2 py-1 text-foreground">
                  decision {route.explanation?.preference ?? "n/a"}
                </span>
                <span className="rounded-full border bg-secondary px-2 py-1 text-foreground">
                  {route.strategy}
                </span>
                <span className="rounded-full border bg-secondary px-2 py-1 text-foreground">
                  attempts {route.attempts}
                </span>
                <span className="rounded-full border bg-secondary px-2 py-1 text-foreground">
                  {route.providerName ?? "none"}
                </span>
              </div>
              {route.explanation?.reasons?.length ? (
                <div className="mt-3 space-y-1">
                  {route.explanation.reasons.slice(0, 2).map((reason) => (
                    <div
                      key={reason}
                      className="text-xs font-mono text-muted-foreground"
                    >
                      {reason}
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
