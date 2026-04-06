import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertCircle, AlertTriangle, Info } from "lucide-react";
import type { SystemEventView } from "@/lib/routex-api";

interface EventsPanelProps {
  events: SystemEventView[];
}

const iconMap = { info: Info, warning: AlertTriangle, error: AlertCircle };

export function EventsPanel({ events }: EventsPanelProps) {
  return (
    <Card className="flex-1 min-h-0 flex flex-col overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="micro-label text-xs">System Events</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto p-3 pt-0 space-y-0.5">
        {events.map(evt => {
          const Icon = iconMap[evt.type];
          return (
            <div
              key={evt.id}
              className="flex items-start gap-2 text-[11px] font-mono py-1.5 px-2 rounded hover:bg-accent transition-colors"
            >
              <Icon className={`w-3 h-3 mt-0.5 shrink-0 ${evt.type === 'error' ? 'text-destructive' : evt.type === 'warning' ? 'text-muted-foreground' : 'text-muted-foreground'}`} />
              <div className="min-w-0 flex-1">
                <span className="text-muted-foreground mr-2">{evt.timestamp}</span>
                <span className="text-foreground/80">{evt.message}</span>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
