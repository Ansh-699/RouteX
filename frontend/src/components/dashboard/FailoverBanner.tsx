import { AlertTriangle, ArrowRightLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { FailoverBanner as FailoverBannerType } from "@/lib/routex-api";
import { relativeTimeFromIso } from "@/lib/routex-api";

interface FailoverBannerProps {
  failover: FailoverBannerType | null;
}

export function FailoverBanner({ failover }: FailoverBannerProps) {
  if (!failover) {
    return null;
  }

  const age = relativeTimeFromIso(failover.createdAt);

  return (
    <Card className="mb-4 border-white/12 bg-white/[0.04]">
      <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 rounded-full bg-white/10 p-2 text-foreground">
            <AlertTriangle className="h-4 w-4" />
          </div>
          <div>
            <div className="micro-label text-foreground/70">Auto Failover</div>
            <p className="mt-1 text-sm font-medium text-foreground">{failover.message}</p>
            <p className="mt-1 text-xs text-muted-foreground">{failover.reason}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-white/10 bg-background/70 px-3 py-1.5 text-xs font-mono text-muted-foreground">
          <ArrowRightLeft className="h-3.5 w-3.5" />
          <span>{age ? `Updated ${age}` : "Live failover state"}</span>
        </div>
      </CardContent>
    </Card>
  );
}
