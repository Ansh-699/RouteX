import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { SiteShell } from "@/components/site/SiteShell";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <SiteShell>
      <div className="flex min-h-[70vh] items-center justify-center">
        <div className="max-w-xl rounded-[2rem] border border-white/10 bg-white/[0.03] p-10 text-center shadow-[0_20px_80px_rgba(0,0,0,0.22)]">
          <div className="micro-label">404</div>
          <h1 className="mt-4 text-5xl font-bold tracking-tight">
            Page not found
          </h1>
          <p className="mt-4 text-sm leading-7 text-muted-foreground">
            The route <span className="font-mono text-foreground">{location.pathname}</span> does not exist.
            Head back to the landing page or jump into the live RouteX app.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button asChild className="rounded-md">
              <Link to="/">Return Home</Link>
            </Button>
            <Button asChild variant="outline" className="rounded-md">
              <Link to="/app">Launch App</Link>
            </Button>
          </div>
        </div>
      </div>
    </SiteShell>
  );
};

export default NotFound;
