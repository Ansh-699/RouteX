import { Link } from "react-router-dom";
import { ArrowRight, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SiteShell } from "@/components/site/SiteShell";
import { featureEntries } from "@/data/site-content";

const highlights = [
  {
    title: "Auto-failover",
    text: "Show provider switches clearly instead of hiding them in logs.",
  },
  {
    title: "Smart routing",
    text: "Fastest, Freshest, Cheapest, and custom rules with one click.",
  },
  {
    title: "Operational clarity",
    text: "Simulate failures, latency spikes, and stale lag when you need to validate behavior.",
  },
];

export default function Index() {
  return (
    <SiteShell>
      <section className="flex min-h-[82vh] flex-col items-center justify-center text-center">
        <div className="relative mb-8 opacity-0 animate-scale-in">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-foreground text-3xl font-bold font-mono text-background shadow-[0_0_40px_rgba(255,255,255,0.08)]">
            RX
          </div>
          <div className="absolute -inset-3 rounded-[1.8rem] bg-foreground/5 blur-xl animate-glow-pulse" />
        </div>

        <span
          className="text-[10px] font-semibold uppercase tracking-[0.32em] text-muted-foreground opacity-0 animate-fade-in"
          style={{ animationDelay: "0.2s" }}
        >
          Solana RPC Router
        </span>

        <h1
          className="mt-5 max-w-4xl text-5xl font-bold leading-tight text-foreground md:text-6xl lg:text-7xl opacity-0 animate-slide-up"
          style={{ animationDelay: "0.35s" }}
        >
          Route smarter.
          <br />
          Ship faster.
        </h1>

        <p
          className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground opacity-0 animate-fade-in"
          style={{ animationDelay: "0.55s" }}
        >
          Intelligent RPC routing for Solana with auto-failover, cost-aware
          decisions, routing explanations, and a live dashboard that makes the
          system easy to trust.
        </p>

        <div
          className="mt-10 flex flex-col items-center gap-4 sm:flex-row opacity-0 animate-fade-in"
          style={{ animationDelay: "0.75s" }}
        >
          <Button
            asChild
            size="lg"
            className="rounded-md bg-foreground px-6 py-3 text-sm font-medium text-background transition-all duration-200 hover:scale-105 hover:opacity-90"
          >
            <Link to="/app">
              Launch App
              <span className="text-xs">↗</span>
            </Link>
          </Button>
          <Link
            to="/features"
            className="inline-flex items-center rounded-md border border-border px-6 py-3 text-sm text-muted-foreground transition-all duration-200 hover:scale-105 hover:border-muted-foreground/40 hover:text-foreground"
          >
            Explore Features
          </Link>
        </div>

        <div className="mt-14 grid w-full max-w-5xl gap-4 md:grid-cols-3">
          {highlights.map((item, index) => (
            <Card
              key={item.title}
              className="border-white/10 bg-white/[0.03] opacity-0 animate-fade-in"
              style={{ animationDelay: `${0.9 + index * 0.12}s` }}
            >
              <CardContent className="p-6 text-left">
                <div className="micro-label">{item.title}</div>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">
                  {item.text}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-8">
          <div className="micro-label">Why teams use RouteX</div>
          <h2 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            One control plane for performance, freshness, and resilience.
          </h2>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {[
              "Smart modes keep routing behavior understandable.",
              "Routing explanations turn infrastructure into something understandable.",
              "Mini charts and event streams make the app feel alive.",
              "Simulation controls make failover and routing validation repeatable.",
            ].map((item) => (
              <div
                key={item}
                className="rounded-2xl border border-white/10 bg-black/40 p-4 text-sm leading-7 text-muted-foreground"
              >
                {item}
              </div>
            ))}
          </div>
        </div>

        <Card className="overflow-hidden rounded-[2rem] border-white/10 bg-black text-white shadow-[0_25px_90px_rgba(0,0,0,0.35)]">
          <CardContent className="p-0">
            <div className="border-b border-white/10 p-6">
              <div className="micro-label text-white/45">Live app preview</div>
              <h3 className="mt-3 text-2xl font-semibold tracking-tight">
                Routing decisions stay visible in real time.
              </h3>
            </div>

            <div className="space-y-4 p-6">
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <div className="micro-label text-white/45">Failover banner</div>
                <div className="mt-2 text-lg font-medium">
                  QuickNode unhealthy, switched to RPCFast.
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <div className="micro-label text-white/45">Smart Mode</div>
                  <div className="mt-2 text-2xl font-bold">Freshest</div>
                  <p className="mt-2 text-sm leading-6 text-white/65">
                    Reads and writes stay pinned to the most up-to-date healthy provider.
                  </p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <div className="micro-label text-white/45">Simulation</div>
                  <div className="mt-2 flex items-center gap-2 text-sm font-medium">
                    <Play className="h-4 w-4" />
                    Simulate provider failure
                  </div>
                  <p className="mt-2 text-sm leading-6 text-white/65">
                    Trigger failure, latency spikes, or stale lag to validate routing behavior.
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <div className="grid gap-4 sm:grid-cols-3">
                  {[
                    ["Latency", "39ms"],
                    ["Slot Lag", "0"],
                    ["Error Rate", "1.3%"],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <div className="text-[10px] uppercase tracking-[0.18em] text-white/45">
                        {label}
                      </div>
                      <div className="mt-2 text-2xl font-bold tracking-tight">
                        {value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="mt-20">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="micro-label">Feature pages</div>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Explore the system one capability at a time.
            </h2>
          </div>
          <Link
            to="/features"
            className="hidden items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground sm:inline-flex"
          >
            View all
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-8 grid gap-4 lg:grid-cols-2">
          {featureEntries.slice(0, 6).map((feature) => (
            <Link key={feature.slug} to={`/features/${feature.slug}`} className="group">
              <Card className="h-full border-white/10 bg-white/[0.03] transition-all duration-200 hover:scale-[1.01] hover:border-white/15 hover:bg-white/[0.05]">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="micro-label">{feature.eyebrow}</div>
                      <h3 className="mt-3 text-2xl font-semibold tracking-tight">
                        {feature.title}
                      </h3>
                      <p className="mt-3 text-sm leading-7 text-muted-foreground">
                        {feature.summary}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-foreground p-3 text-background shadow-[0_0_24px_rgba(255,255,255,0.08)]">
                      <feature.icon className="h-5 w-5" />
                    </div>
                  </div>

                  <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4 text-sm">
                    <div>
                      <div className="font-semibold text-foreground">
                        {feature.heroMetric}
                      </div>
                      <div className="mt-1 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                        {feature.heroLabel}
                      </div>
                    </div>
                    <div className="text-muted-foreground transition-transform duration-200 group-hover:translate-x-1 group-hover:text-foreground">
                      Read page
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>
    </SiteShell>
  );
}
