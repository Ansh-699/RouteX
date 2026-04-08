import { AlertTriangle, Gauge, RotateCcw, Unplug } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DemoScenario, DemoStatus } from "@/lib/routex-api";

interface DemoModePanelProps {
  demo: DemoStatus | null;
  onTrigger: (scenario: DemoScenario) => Promise<void>;
  disabled?: boolean;
}

const scenarios: Array<{
  scenario: DemoScenario;
  label: string;
  description: string;
  icon: typeof Unplug;
}> = [
  {
    scenario: "provider-failure",
    label: "Fail Provider",
    description: "Disable the current leader and force an immediate failover.",
    icon: Unplug,
  },
  {
    scenario: "latency-spike",
    label: "Spike Latency",
    description: "Add a big latency spike to the active provider.",
    icon: Gauge,
  },
  {
    scenario: "stale-slot-lag",
    label: "Stale Lag",
    description: "Push the leader behind the chain tip to validate freshness routing.",
    icon: AlertTriangle,
  },
  {
    scenario: "reset",
    label: "Reset State",
    description: "Restore the mock cluster to its original healthy state.",
    icon: RotateCcw,
  },
];

export function DemoModePanel({
  demo,
  onTrigger,
  disabled = false,
}: DemoModePanelProps) {
  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="micro-label text-xs">Operational Simulation</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-xl border bg-background p-4">
          <div className="text-sm font-medium text-foreground">
            {demo?.available ? "Mock cluster connected" : "Mock cluster not detected"}
          </div>
          <p className="mt-1 text-xs font-mono text-muted-foreground">
            {demo?.available
              ? "These controls mutate the local mock providers so routing behavior can be tested on demand."
              : "Start the bundled simulation cluster to unlock one-click failure, latency, and stale-slot simulations."}
          </p>
        </div>

        <div className="grid gap-3">
          {scenarios.map((entry) => (
            <button
              key={entry.scenario}
              type="button"
              disabled={disabled || !demo?.available}
              onClick={() => void onTrigger(entry.scenario)}
              className="rounded-xl border bg-background p-4 text-left transition-colors hover:bg-accent disabled:cursor-not-allowed disabled:opacity-60"
            >
              <div className="flex items-center gap-2">
                <entry.icon className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">{entry.label}</span>
              </div>
              <p className="mt-2 text-xs font-mono leading-5 text-muted-foreground">
                {entry.description}
              </p>
            </button>
          ))}
        </div>

        {demo?.providers.length ? (
          <div className="space-y-2">
            <div className="micro-label">Simulation Providers</div>
            {demo.providers.map((provider) => (
              <div
                key={provider.name}
                className="flex items-center justify-between rounded-lg border bg-background px-3 py-2 text-xs font-mono"
              >
                <div>
                  <div className="text-foreground">{provider.name}</div>
                  <div className="text-muted-foreground">
                    {provider.behavior
                      ? `lag ${provider.behavior.lagSlots} · latency ${provider.behavior.latencyMs}ms · enabled ${provider.behavior.enabled ? "yes" : "no"}`
                      : provider.error ?? "unavailable"}
                  </div>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="font-mono text-[10px]"
                  disabled={disabled || !demo.available}
                  onClick={(event) => {
                    event.stopPropagation();
                    void onTrigger("reset");
                  }}
                >
                  reset
                </Button>
              </div>
            ))}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
