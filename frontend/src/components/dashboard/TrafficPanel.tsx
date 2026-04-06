import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";
import type { TrafficLogView } from "@/lib/routex-api";

interface TrafficPanelProps {
  logs: TrafficLogView[];
}

export function TrafficPanel({ logs }: TrafficPanelProps) {
  return (
    <Card className="flex-1 min-h-0 flex flex-col overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="micro-label text-xs">Network Traffic</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto p-3 pt-0 space-y-0.5">
        {logs.map(log => (
          <div
            key={log.id}
            className="flex items-center gap-2 text-[11px] font-mono py-1.5 px-2 rounded hover:bg-accent transition-colors"
          >
            <span className="text-muted-foreground shrink-0">{log.timestamp}</span>
            <span className="text-foreground/80 truncate flex-1">{log.method}</span>
            <ArrowRight className="w-3 h-3 text-muted-foreground shrink-0" />
            <span className={log.status === "failed" ? "text-destructive font-medium shrink-0" : "text-foreground font-medium shrink-0"}>
              {log.provider}
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
