import { useState } from "react";
import { ArrowUpRight, Menu } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navigation = [
  { to: "/", label: "Home" },
  { to: "/features", label: "Features" },
  { to: "/app", label: "Launch App" },
];

export default function Navbar() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (path: string) =>
    path === "/"
      ? location.pathname === path
      : location.pathname === path || location.pathname.startsWith(`${path}/`);

  return (
    <header className="sticky top-0 z-40 border-b border-white/6 bg-black/55 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-6 py-4">
        <div className="flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-foreground text-sm font-bold font-mono text-background shadow-[0_0_30px_rgba(255,255,255,0.08)]">
            RX
          </div>
          <div>
            <div className="text-sm font-semibold tracking-tight text-foreground">
              RouteX
            </div>
            <div className="text-[10px] uppercase tracking-[0.28em] text-muted-foreground">
              Solana RPC Router
            </div>
          </div>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {navigation.map((item) => {
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "rounded-full px-4 py-2 text-sm transition-all duration-200",
                  isActive(item.to)
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:bg-white/5 hover:text-foreground",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <Button
            asChild
            size="sm"
            className="rounded-full bg-foreground px-4 font-medium text-background hover:scale-[1.03] hover:opacity-90"
          >
            <Link to="/app">
              Launch App
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-muted-foreground transition-colors hover:text-foreground md:hidden"
            aria-label="Open navigation"
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((value) => !value)}
          >
            <Menu className="h-4 w-4" />
          </button>
        </div>
        </div>

        {mobileOpen ? (
          <nav className="mt-4 grid gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-3 md:hidden">
            {navigation.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "rounded-xl px-4 py-3 text-sm transition-all duration-200",
                  isActive(item.to)
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:bg-white/5 hover:text-foreground",
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        ) : null}
      </div>
    </header>
  );
}
