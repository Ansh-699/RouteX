import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { SiteShell } from "@/components/site/SiteShell";
import { featureEntries } from "@/data/site-content";

export default function Features() {
  return (
    <SiteShell>
      <section className="mx-auto max-w-4xl text-center">
        <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-muted-foreground">
          Feature Library
        </span>
        <h1 className="mt-5 text-5xl font-bold leading-tight text-foreground md:text-6xl">
          Every RouteX feature,
          <br />
          explained clearly.
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
          These pages break RouteX into focused product capabilities so teams
          can understand how routing, failover, observability, and controls fit
          together.
        </p>
      </section>

      <section className="mt-14 grid gap-4 lg:grid-cols-2">
        {featureEntries.map((feature, index) => (
          <Link
            key={feature.slug}
            to={`/features/${feature.slug}`}
            className="group opacity-0 animate-fade-in"
            style={{ animationDelay: `${0.12 + index * 0.05}s` }}
          >
            <Card className="h-full border-white/10 bg-white/[0.03] transition-all duration-200 hover:scale-[1.01] hover:border-white/15 hover:bg-white/[0.05]">
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="micro-label">{feature.eyebrow}</div>
                    <h2 className="mt-3 text-2xl font-semibold tracking-tight text-foreground">
                      {feature.title}
                    </h2>
                    <p className="mt-3 text-sm leading-7 text-muted-foreground">
                      {feature.summary}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-foreground p-3 text-background">
                    <feature.icon className="h-5 w-5" />
                  </div>
                </div>

                <div className="mt-8 flex items-center justify-between border-t border-white/10 pt-4">
                  <div>
                    <div className="text-lg font-semibold text-foreground">
                      {feature.heroMetric}
                    </div>
                    <div className="mt-1 text-xs uppercase tracking-[0.18em] text-muted-foreground">
                      {feature.heroLabel}
                    </div>
                  </div>
                  <div className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-transform duration-200 group-hover:translate-x-1 group-hover:text-foreground">
                    Open page
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </section>
    </SiteShell>
  );
}
