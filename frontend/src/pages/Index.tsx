import { useState, useEffect, useCallback } from "react";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { MetricsHUD } from "@/components/dashboard/MetricsHUD";
import { ProvidersTable } from "@/components/dashboard/ProvidersTable";
import { RaceView } from "@/components/dashboard/RaceView";
import { SelectionRationale } from "@/components/dashboard/SelectionRationale";
import { ManualProbe } from "@/components/dashboard/ManualProbe";
import { TrafficPanel } from "@/components/dashboard/TrafficPanel";
import { EventsPanel } from "@/components/dashboard/EventsPanel";
import {
  type HealthResponse,
  type MetricsResponse,
  fetchDashboardSnapshot,
  toProviderViews,
  toSystemEventViews,
  toTrafficLogViews,
} from "@/lib/routex-api";

export default function Index() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [metrics, setMetrics] = useState<MetricsResponse | null>(null);
  const [trafficLogs, setTrafficLogs] = useState(() => toTrafficLogViews([]));
  const [systemEvents, setSystemEvents] = useState(() => toSystemEventViews([]));
  const [status, setStatus] = useState<"connecting" | "live" | "error">("connecting");
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const snapshot = await fetchDashboardSnapshot();
      setHealth(snapshot.health);
      setMetrics(snapshot.metrics);
      setTrafficLogs(toTrafficLogViews(snapshot.routes));
      setSystemEvents(toSystemEventViews(snapshot.events));
      setStatus("live");
      setLastUpdatedAt(new Date().toISOString());
    } catch (error) {
      console.error("RouteX Pulse refresh failed", error);
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    void refresh();
    const interval = setInterval(() => {
      void refresh();
    }, 2000);

    return () => clearInterval(interval);
  }, [refresh]);

  const activeProviderName =
    health?.bestProvider?.name ??
    health?.providers.find((provider) => provider.active)?.name ??
    null;

  const providers = toProviderViews(
    health?.providers ?? [],
    metrics?.routeProviderCounts ?? {},
    activeProviderName,
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="flex flex-col lg:flex-row min-h-screen">
        {/* Main content */}
        <div className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <DashboardHeader
            status={status}
            lastUpdatedAt={lastUpdatedAt}
            lastSwitchAt={health?.lastActiveSwitchAt ?? null}
          />
          <MetricsHUD health={health} metrics={metrics} />

          {/* Providers + Race side by side */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-4">
            <ProvidersTable providers={providers} />
            <RaceView providers={providers} />
          </div>

          {/* Bottom */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SelectionRationale health={health} metrics={metrics} providers={providers} />
            <ManualProbe />
          </div>
        </div>

        {/* Right sidebar */}
        <div className="w-full lg:w-80 xl:w-96 border-t lg:border-t-0 lg:border-l border-border p-4 sm:p-6 flex flex-col gap-4 lg:max-h-screen lg:overflow-hidden">
          <TrafficPanel logs={trafficLogs} />
          <EventsPanel events={systemEvents} />
        </div>
      </div>
    </div>
  );
}
