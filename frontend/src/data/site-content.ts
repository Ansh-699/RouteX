import {
  Activity,
  ArrowRightLeft,
  BellRing,
  Coins,
  Gauge,
  Route,
  Sparkles,
  TriangleAlert,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type FeatureEntry = {
  slug: string;
  title: string;
  eyebrow: string;
  summary: string;
  icon: LucideIcon;
  heroMetric: string;
  heroLabel: string;
  bullets: string[];
  callout: string;
};

export const featureEntries: FeatureEntry[] = [
  {
    slug: "smart-routing-modes",
    title: "Smart Routing Modes",
    eyebrow: "Fastest · Freshest · Cheapest",
    summary:
      "Switch RouteX between demo-friendly presets so the product feels transparent and controllable in seconds.",
    icon: Sparkles,
    heroMetric: "3 presets",
    heroLabel: "plus custom rules",
    bullets: [
      "Fastest favors latency for read-heavy apps.",
      "Freshest protects reads and writes with slot-aware ranking.",
      "Cheapest keeps budget pressure visible without losing failover safety.",
    ],
    callout:
      "Professional products feel opinionated and controllable. Smart modes make the router instantly understandable.",
  },
  {
    slug: "auto-failover-visibility",
    title: "Auto-Failover Visibility",
    eyebrow: "Trust Through Clarity",
    summary:
      "Surface unhealthy providers and live provider switches in a way judges and users can understand immediately.",
    icon: TriangleAlert,
    heroMetric: "Live banner",
    heroLabel: "with switch reason",
    bullets: [
      "Shows messages like 'QuickNode unhealthy, switched to RPCFast.'",
      "Captures why the switch happened, not just that it happened.",
      "Turns backend resiliency into a visible product moment.",
    ],
    callout:
      "A failover that users can see is much easier to trust than one hidden inside logs.",
  },
  {
    slug: "historical-observability",
    title: "Historical Observability",
    eyebrow: "Last Five Minutes",
    summary:
      "Give the dashboard motion and context with mini charts for latency, slot lag, and error rate.",
    icon: Activity,
    heroMetric: "5-minute view",
    heroLabel: "latency, lag, error rate",
    bullets: [
      "Tiny trend charts make the health story easy to follow in a demo.",
      "Data stays lightweight and tied to the live provider state.",
      "Observability becomes part of the product, not a hidden ops screen.",
    ],
    callout:
      "Mini charts make RouteX feel alive instead of static, which matters a lot in presentations.",
  },
  {
    slug: "custom-routing-rules",
    title: "Custom Routing Rules",
    eyebrow: "Simple But Powerful",
    summary:
      "Split reads, fresh reads, writes, and fallback behavior without needing a heavyweight policy engine.",
    icon: Route,
    heroMetric: "4 rule lanes",
    heroLabel: "read, fresh-read, write, fallback",
    bullets: [
      "Reads can optimize for fastest while writes stay freshest.",
      "Fresh-read traffic can stay stricter than generic reads.",
      "Fallback provider selection turns policy into something explicit.",
    ],
    callout:
      "Custom rules make the app feel capable while staying easy enough for a live walkthrough.",
  },
  {
    slug: "demo-mode",
    title: "One-Click Demo Mode",
    eyebrow: "Guaranteed Live Story",
    summary:
      "Simulate provider failure, latency spikes, and stale slot lag on demand so your demo never depends on luck.",
    icon: Gauge,
    heroMetric: "4 scenarios",
    heroLabel: "including reset",
    bullets: [
      "Force a provider failure to show failover instantly.",
      "Inject latency spikes to show speed-based routing decisions.",
      "Create stale lag to highlight freshness-aware behavior.",
    ],
    callout:
      "Hackathon demos become much stronger when the wow moment is deterministic.",
  },
  {
    slug: "alerts-and-explanations",
    title: "Alerts And Explanations",
    eyebrow: "Explain Every Decision",
    summary:
      "Push critical events to Telegram or Discord and explain why each request landed on a specific provider.",
    icon: BellRing,
    heroMetric: "2 alert channels",
    heroLabel: "plus request rationale",
    bullets: [
      "Webhook alerts cover stale providers and active failovers.",
      "Request explanations turn routing from black box into product logic.",
      "Recent request rationale helps users and judges trust the system.",
    ],
    callout:
      "Good infrastructure products narrate their choices. Great ones do it in plain language.",
  },
  {
    slug: "cost-aware-routing",
    title: "Cost-Aware Routing",
    eyebrow: "Budget Meets Performance",
    summary:
      "Assign a simple cost score per provider and let RouteX balance spend alongside speed and freshness.",
    icon: Coins,
    heroMetric: "Editable cost score",
    heroLabel: "per provider",
    bullets: [
      "Operators can model premium and public RPCs with simple weights.",
      "Cheapest mode becomes a practical procurement story, not just a gimmick.",
      "Cost stays visible in both the UI and the routing engine.",
    ],
    callout:
      "Cost-aware routing makes RouteX feel useful for production teams, not just demos.",
  },
  {
    slug: "launch-ready-dashboard",
    title: "Launch-Ready Dashboard",
    eyebrow: "Separate Site And App",
    summary:
      "Marketing, navigation, feature storytelling, and the operational dashboard now live in the right places.",
    icon: ArrowRightLeft,
    heroMetric: "2 experiences",
    heroLabel: "site and app",
    bullets: [
      "Landing page sells the value before users see controls.",
      "Feature pages explain each capability in focused detail.",
      "The live dashboard moves into a dedicated app route.",
    ],
    callout:
      "This structure feels much more like a professional product than dropping everyone into a dense control room.",
  },
];

export function getFeatureEntry(slug: string) {
  return featureEntries.find((entry) => entry.slug === slug) ?? null;
}
