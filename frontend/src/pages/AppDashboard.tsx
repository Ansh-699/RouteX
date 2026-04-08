import { startTransition, useCallback, useEffect, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { routexDarkThemeVars } from "@/components/site/theme";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { DemoModePanel } from "@/components/dashboard/DemoModePanel";
import { EventsPanel } from "@/components/dashboard/EventsPanel";
import { FailoverBanner } from "@/components/dashboard/FailoverBanner";
import { HistoryMiniCharts } from "@/components/dashboard/HistoryMiniCharts";
import { ManualProbe } from "@/components/dashboard/ManualProbe";
import { MetricsHUD } from "@/components/dashboard/MetricsHUD";
import { ProductOverview } from "@/components/dashboard/ProductOverview";
import { ProvidersTable } from "@/components/dashboard/ProvidersTable";
import { RaceView } from "@/components/dashboard/RaceView";
import { RoutingExplanationPanel } from "@/components/dashboard/RoutingExplanationPanel";
import { SelectionRationale } from "@/components/dashboard/SelectionRationale";
import { SmartRoutingPanel } from "@/components/dashboard/SmartRoutingPanel";
import { TrafficPanel } from "@/components/dashboard/TrafficPanel";
import {
  type DemoScenario,
  type DemoStatus,
  type HealthResponse,
  type HistoryResponse,
  type MetricsResponse,
  type RouteLogEntry,
  type SettingsResponse,
  fetchDashboardSnapshot,
  toProviderViews,
  toSystemEventViews,
  toTrafficLogViews,
  triggerDemoScenario,
  updateSettings,
} from "@/lib/routex-api";

export default function AppDashboard() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [metrics, setMetrics] = useState<MetricsResponse | null>(null);
  const [history, setHistory] = useState<HistoryResponse>({});
  const [settings, setSettings] = useState<SettingsResponse | null>(null);
  const [demo, setDemo] = useState<DemoStatus | null>(null);
  const [routes, setRoutes] = useState<RouteLogEntry[]>([]);
  const [trafficLogs, setTrafficLogs] = useState(() => toTrafficLogViews([]));
  const [systemEvents, setSystemEvents] = useState(() => toSystemEventViews([]));
  const [status, setStatus] = useState<"connecting" | "live" | "error">("connecting");
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null);
  const [actionBusy, setActionBusy] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const snapshot = await fetchDashboardSnapshot();
      startTransition(() => {
        setHealth(snapshot.health);
        setMetrics(snapshot.metrics);
        setHistory(snapshot.history);
        setSettings(snapshot.settings);
        setDemo(snapshot.demo);
        setRoutes(snapshot.routes);
        setTrafficLogs(toTrafficLogViews(snapshot.routes));
        setSystemEvents(toSystemEventViews(snapshot.events));
        setStatus("live");
        setLastUpdatedAt(new Date().toISOString());
      });
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

  const handleApplySettings = useCallback(
    async (payload: Parameters<typeof updateSettings>[0]) => {
      setActionBusy(true);
      try {
        const nextSettings = await updateSettings(payload);
        setSettings(nextSettings);
        await refresh();
        toast.success("RouteX routing settings updated");
      } catch (error) {
        console.error(error);
        toast.error(error instanceof Error ? error.message : "Failed to update settings");
      } finally {
        setActionBusy(false);
      }
    },
    [refresh],
  );

  const handleDemoScenario = useCallback(
    async (scenario: DemoScenario) => {
      setActionBusy(true);
      try {
        const result = await triggerDemoScenario(scenario);
        setDemo(result.status);
        await refresh();
        toast.success(`Demo scenario applied: ${scenario}`);
      } catch (error) {
        console.error(error);
        toast.error(error instanceof Error ? error.message : "Failed to trigger demo");
      } finally {
        setActionBusy(false);
      }
    },
    [refresh],
  );

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
    <div
      style={routexDarkThemeVars}
      className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.04),transparent_18%),linear-gradient(180deg,#030303_0%,#0a0a0a_100%)] text-foreground"
    >
      <div className="flex min-h-screen flex-col lg:flex-row">
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="mb-4 flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
            <div>
              <div className="micro-label">App Mode</div>
              <div className="text-sm text-muted-foreground">
                Live routing dashboard for operations, demos, and failover validation.
              </div>
            </div>
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-md border border-white/10 px-3 py-2 text-xs font-mono uppercase tracking-[0.16em] text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to site
            </Link>
          </div>

          <DashboardHeader
            status={status}
            lastUpdatedAt={lastUpdatedAt}
            lastSwitchAt={health?.lastActiveSwitchAt ?? null}
          />
          <FailoverBanner failover={health?.latestFailover ?? null} />
          <ProductOverview
            health={health}
            metrics={metrics}
            status={status}
            activeProviderName={activeProviderName}
          />
          <MetricsHUD health={health} metrics={metrics} />
          <HistoryMiniCharts history={history} providers={providers} />

          <div className="mb-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
            <SmartRoutingPanel
              settings={settings}
              providers={providers}
              onApply={handleApplySettings}
            />
            <DemoModePanel
              demo={demo}
              onTrigger={handleDemoScenario}
              disabled={actionBusy}
            />
          </div>

          <div className="mb-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
            <ProvidersTable providers={providers} />
            <RaceView providers={providers} />
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            <RoutingExplanationPanel routes={routes} />
            <SelectionRationale
              health={health}
              metrics={metrics}
              providers={providers}
              settings={settings}
            />
            <ManualProbe />
          </div>
        </div>

        <div className="flex w-full flex-col gap-4 border-t border-border p-4 sm:p-6 lg:max-h-screen lg:w-80 lg:overflow-hidden lg:border-l lg:border-t-0 xl:w-96">
          <TrafficPanel logs={trafficLogs} />
          <EventsPanel events={systemEvents} />
        </div>
      </div>
    </div>
  );
}
