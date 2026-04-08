import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="border-t border-white/6 bg-black/40">
      <div className="mx-auto flex max-w-7xl flex-col gap-5 px-6 py-8 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
        <div>
          <div className="font-medium text-foreground">RouteX</div>
          <p className="mt-1 max-w-md text-sm leading-6 text-muted-foreground">
            Intelligent RPC routing for Solana with failover visibility, cost-aware
            decisions, and built-in observability.
          </p>
        </div>

        <div className="flex items-center gap-5 text-xs font-mono uppercase tracking-[0.18em]">
          <Link to="/" className="hover:text-foreground">
            Home
          </Link>
          <Link to="/features" className="hover:text-foreground">
            Features
          </Link>
          <Link to="/app" className="hover:text-foreground">
            App
          </Link>
        </div>
      </div>
    </footer>
  );
}
