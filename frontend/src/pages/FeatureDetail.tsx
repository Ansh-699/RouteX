import { ArrowLeft, ArrowUpRight, Check } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SiteShell } from "@/components/site/SiteShell";
import { featureEntries, getFeatureEntry } from "@/data/site-content";

export default function FeatureDetail() {
  const { slug = "" } = useParams();
  const feature = getFeatureEntry(slug);

  if (!feature) {
    return (
      <SiteShell>
        <div className="flex min-h-[72vh] items-center justify-center">
          <Card className="w-full max-w-2xl border-white/10 bg-white/[0.03]">
            <CardContent className="p-10 text-center">
              <div className="micro-label">Feature Not Found</div>
              <h1 className="mt-4 text-4xl font-bold text-foreground">
                This feature page does not exist.
              </h1>
              <p className="mt-4 text-sm leading-7 text-muted-foreground">
                Head back to the features index or jump into the live app.
              </p>
              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                <Button asChild className="rounded-md">
                  <Link to="/features">Browse Features</Link>
                </Button>
                <Button asChild variant="outline" className="rounded-md">
                  <Link to="/app">Launch App</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </SiteShell>
    );
  }

  const related = featureEntries.filter((entry) => entry.slug !== feature.slug).slice(0, 3);

  return (
    <SiteShell>
      <section className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
        <div>
          <Link
            to="/features"
            className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to features
          </Link>

          <div className="mt-6 inline-flex rounded-md border border-white/10 bg-white/[0.03] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.28em] text-muted-foreground">
            {feature.eyebrow}
          </div>

          <h1 className="mt-5 text-5xl font-bold leading-tight text-foreground md:text-6xl">
            {feature.title}
          </h1>
          <p className="mt-6 max-w-3xl text-lg leading-relaxed text-muted-foreground">
            {feature.summary}
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="rounded-md">
              <Link to="/app">
                Launch App
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-md">
              <Link to="/features">More Features</Link>
            </Button>
          </div>
        </div>

        <Card className="overflow-hidden border-white/10 bg-black text-white shadow-[0_25px_90px_rgba(0,0,0,0.35)]">
          <CardContent className="p-0">
            <div className="border-b border-white/10 p-6">
              <div className="micro-label text-white/45">Feature snapshot</div>
              <div className="mt-4 flex items-center justify-between gap-4">
                <div>
                  <div className="text-3xl font-bold tracking-tight">
                    {feature.heroMetric}
                  </div>
                  <div className="mt-2 text-xs uppercase tracking-[0.2em] text-white/55">
                    {feature.heroLabel}
                  </div>
                </div>
                <div className="rounded-2xl bg-white/10 p-4">
                  <feature.icon className="h-6 w-6" />
                </div>
              </div>
            </div>
            <div className="p-6 text-sm leading-7 text-white/70">{feature.callout}</div>
          </CardContent>
        </Card>
      </section>

      <section className="mt-14 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="border-white/10 bg-white/[0.03]">
          <CardContent className="p-8">
            <div className="micro-label">Why this matters</div>
            <div className="mt-6 grid gap-4">
              {feature.bullets.map((bullet) => (
                <div
                  key={bullet}
                  className="flex items-start gap-3 rounded-2xl border border-white/10 bg-black/35 p-4"
                >
                  <div className="mt-0.5 rounded-full bg-foreground p-1 text-background">
                    <Check className="h-3.5 w-3.5" />
                  </div>
                  <p className="text-sm leading-7 text-muted-foreground">{bullet}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/[0.03]">
          <CardContent className="p-8">
            <div className="micro-label">Product flow</div>
            <h2 className="mt-4 text-2xl font-semibold tracking-tight text-foreground">
              Tell the story first, then open the control plane.
            </h2>
            <p className="mt-4 text-sm leading-7 text-muted-foreground">
              This page is part of a more polished product flow. Users can learn
              one capability at a time before stepping into the live routing
              dashboard.
            </p>

            <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                Suggested flow
              </div>
              <div className="mt-4 text-sm leading-7 text-foreground">
                Landing page, feature detail, launch app, live dashboard
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="mt-14">
        <div className="micro-label">Related pages</div>
        <h2 className="mt-3 text-3xl font-bold tracking-tight text-foreground">
          Keep exploring the product story.
        </h2>

        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          {related.map((entry) => (
            <Link key={entry.slug} to={`/features/${entry.slug}`} className="group">
              <Card className="h-full border-white/10 bg-white/[0.03] transition-all duration-200 hover:scale-[1.01] hover:border-white/15 hover:bg-white/[0.05]">
                <CardContent className="p-6">
                  <div className="micro-label">{entry.eyebrow}</div>
                  <h3 className="mt-3 text-xl font-semibold tracking-tight text-foreground">
                    {entry.title}
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-muted-foreground">
                    {entry.summary}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </section>
    </SiteShell>
  );
}
