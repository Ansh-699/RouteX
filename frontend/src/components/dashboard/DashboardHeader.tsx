import { formatTime, relativeTimeFromIso } from "@/lib/routex-api";

interface DashboardHeaderProps {
  status: "connecting" | "live" | "error";
  lastUpdatedAt: string | null;
  lastSwitchAt: string | null;
}

export function DashboardHeader({
  status,
  lastUpdatedAt,
  lastSwitchAt,
}: DashboardHeaderProps) {
  const lastSwitchAgo = relativeTimeFromIso(lastSwitchAt);
  const isLive = status === "live";
  const statusText =
    status === "live" && lastUpdatedAt
      ? `Live at ${formatTime(lastUpdatedAt)}`
      : status === "error"
        ? "API error"
        : "Connecting…";

  return (
    <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
      <div>
        <h1 className="text-3xl sm:text-4xl font-black tracking-tighter font-mono text-foreground">
          ROUTE<span className="text-muted-foreground">X</span>
        </h1>
        <p className="micro-label mt-1">
          Adaptive RPC router · live health · race view
        </p>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="border rounded-md px-3 py-1.5 flex items-center gap-2 text-xs font-mono bg-card">
          <div className={`w-1.5 h-1.5 rounded-full ${lastSwitchAgo ? "bg-foreground animate-pulse" : "bg-muted-foreground"}`} />
          <span className="text-muted-foreground">
            {lastSwitchAgo === null ? "Stable: no switch yet" : `Last switch ${lastSwitchAgo}`}
          </span>
        </div>

        <div className="border rounded-md px-3 py-1.5 flex items-center gap-2 text-xs font-mono bg-card">
          <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-foreground animate-pulse' : status === "error" ? 'bg-destructive' : 'bg-muted-foreground'}`} />
          <span className={isLive ? 'text-foreground' : status === "error" ? 'text-destructive' : 'text-muted-foreground'}>
            {statusText}
          </span>
        </div>
      </div>
    </header>
  );
}
