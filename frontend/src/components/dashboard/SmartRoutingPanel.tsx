import { useEffect, useState } from "react";
import { Coins, Send, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import type {
  AlertSettings,
  ProviderView,
  RoutingPreference,
  RoutingRules,
  SettingsResponse,
  SmartMode,
} from "@/lib/routex-api";

interface SmartRoutingPanelProps {
  settings: SettingsResponse | null;
  providers: ProviderView[];
  onApply: (payload: {
    mode?: SmartMode;
    rules?: Partial<RoutingRules>;
    providerCosts?: Record<string, number>;
    alerts?: Partial<AlertSettings>;
  }) => Promise<void>;
}

type DraftState = {
  mode: SmartMode;
  rules: RoutingRules;
  providerCosts: Record<string, number>;
  alerts: AlertSettings;
};

const modeOptions: SmartMode[] = ["fastest", "freshest", "cheapest", "custom"];
const preferenceOptions: RoutingPreference[] = ["fastest", "freshest", "cheapest"];

export function SmartRoutingPanel({
  settings,
  providers,
  onApply,
}: SmartRoutingPanelProps) {
  const [draft, setDraft] = useState<DraftState | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!settings) {
      return;
    }

    setDraft({
      mode: settings.mode,
      rules: settings.rules,
      providerCosts: settings.providerCosts,
      alerts: settings.alerts,
    });
  }, [settings]);

  if (!draft) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="micro-label text-xs">Smart Routing</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground font-mono">
          Loading runtime routing settings...
        </CardContent>
      </Card>
    );
  }

  const saveDraft = async () => {
    setSaving(true);
    try {
      await onApply({
        mode: "custom",
        rules: draft.rules,
        providerCosts: draft.providerCosts,
        alerts: draft.alerts,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleModeChange = async (mode: SmartMode) => {
    setDraft((current) => (current ? { ...current, mode } : current));

    if (mode === "custom") {
      return;
    }

    setSaving(true);
    try {
      await onApply({ mode });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="micro-label text-xs">Smart Routing</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div>
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
            <span className="micro-label">Mode Toggle</span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 xl:grid-cols-4">
            {modeOptions.map((mode) => (
              <Button
                key={mode}
                type="button"
                size="sm"
                variant={draft.mode === mode ? "default" : "outline"}
                className="font-mono text-xs capitalize"
                disabled={saving}
                onClick={() => void handleModeChange(mode)}
              >
                {mode}
              </Button>
            ))}
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {[
            { key: "read", label: "reads", value: draft.rules.read },
            { key: "freshRead", label: "fresh reads", value: draft.rules.freshRead },
            { key: "write", label: "writes", value: draft.rules.write },
          ].map((rule) => (
            <label key={rule.key} className="space-y-2">
              <div className="micro-label">{rule.label}</div>
              <select
                className="w-full rounded-md border bg-background px-3 py-2 text-sm font-mono outline-none"
                value={rule.value}
                onChange={(event) =>
                  setDraft((current) =>
                    current
                      ? {
                          ...current,
                          mode: "custom",
                          rules: {
                            ...current.rules,
                            [rule.key]: event.target.value as RoutingPreference,
                          },
                        }
                      : current,
                  )
                }
              >
                {preferenceOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
          ))}

          <label className="space-y-2">
            <div className="micro-label">fallback</div>
            <select
              className="w-full rounded-md border bg-background px-3 py-2 text-sm font-mono outline-none"
              value={draft.rules.fallbackProvider ?? ""}
              onChange={(event) =>
                setDraft((current) =>
                  current
                    ? {
                        ...current,
                        mode: "custom",
                        rules: {
                          ...current.rules,
                          fallbackProvider: event.target.value || null,
                        },
                      }
                    : current,
                )
              }
            >
              <option value="">none</option>
              {settings?.availableFallbackProviders.map((providerName) => (
                <option key={providerName} value={providerName}>
                  {providerName}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div>
          <div className="flex items-center gap-2">
            <Coins className="h-4 w-4 text-muted-foreground" />
            <span className="micro-label">Cost-Aware Routing</span>
          </div>
          <div className="mt-3 grid gap-2">
            {providers.map((provider) => (
              <div
                key={provider.id}
                className="grid grid-cols-[1fr_96px] items-center gap-3 rounded-lg border bg-background px-3 py-2"
              >
                <div className="min-w-0">
                  <div className="text-sm font-medium text-foreground">{provider.name}</div>
                  <div className="text-xs font-mono text-muted-foreground">
                    latency {provider.latency === null ? "—" : `${Math.round(provider.latency)}ms`} · lag {provider.lag ?? "—"}
                  </div>
                </div>
                <Input
                  type="number"
                  min="0"
                  step="0.5"
                  value={draft.providerCosts[provider.name] ?? provider.costScore}
                  onChange={(event) =>
                    setDraft((current) =>
                      current
                        ? {
                            ...current,
                            mode: "custom",
                            providerCosts: {
                              ...current.providerCosts,
                              [provider.name]: Number.parseFloat(event.target.value || "0"),
                            },
                          }
                        : current,
                    )
                  }
                  className="font-mono"
                />
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center gap-2">
            <Send className="h-4 w-4 text-muted-foreground" />
            <span className="micro-label">Alerts</span>
          </div>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <div className="micro-label">Telegram Webhook</div>
              <Input
                placeholder="https://api.telegram.org/bot.../sendMessage"
                value={draft.alerts.telegramWebhookUrl ?? ""}
                onChange={(event) =>
                  setDraft((current) =>
                    current
                      ? {
                          ...current,
                          alerts: {
                            ...current.alerts,
                            telegramWebhookUrl: event.target.value || null,
                          },
                        }
                      : current,
                  )
                }
              />
            </div>
            <div className="space-y-2">
              <div className="micro-label">Discord Webhook</div>
              <Input
                placeholder="https://discord.com/api/webhooks/..."
                value={draft.alerts.discordWebhookUrl ?? ""}
                onChange={(event) =>
                  setDraft((current) =>
                    current
                      ? {
                          ...current,
                          alerts: {
                            ...current.alerts,
                            discordWebhookUrl: event.target.value || null,
                          },
                        }
                      : current,
                  )
                }
              />
            </div>
          </div>

          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <label className="flex items-center justify-between rounded-lg border bg-background px-3 py-2">
              <div>
                <div className="text-sm font-medium text-foreground">Provider stale alerts</div>
                <div className="text-xs font-mono text-muted-foreground">Send on stale health windows</div>
              </div>
              <Switch
                checked={draft.alerts.notifyOnProviderStale}
                onCheckedChange={(checked) =>
                  setDraft((current) =>
                    current
                      ? {
                          ...current,
                          alerts: {
                            ...current.alerts,
                            notifyOnProviderStale: checked,
                          },
                        }
                      : current,
                  )
                }
              />
            </label>

            <label className="flex items-center justify-between rounded-lg border bg-background px-3 py-2">
              <div>
                <div className="text-sm font-medium text-foreground">Failover alerts</div>
                <div className="text-xs font-mono text-muted-foreground">Send when RouteX switches providers</div>
              </div>
              <Switch
                checked={draft.alerts.notifyOnFailover}
                onCheckedChange={(checked) =>
                  setDraft((current) =>
                    current
                      ? {
                          ...current,
                          alerts: {
                            ...current.alerts,
                            notifyOnFailover: checked,
                          },
                        }
                      : current,
                  )
                }
              />
            </label>
          </div>
        </div>

        <div className="flex justify-end">
          <Button
            type="button"
            onClick={() => void saveDraft()}
            disabled={saving}
            className="font-mono text-xs"
          >
            {saving ? "Saving..." : "Save Custom Rules"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
