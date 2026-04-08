import type { ReactNode } from "react";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { routexDarkThemeVars } from "@/components/site/theme";

interface SiteShellProps {
  children: ReactNode;
}

export function SiteShell({ children }: SiteShellProps) {
  return (
    <div
      style={routexDarkThemeVars}
      className="relative isolate min-h-screen bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.05),transparent_18%),radial-gradient(circle_at_15%_15%,rgba(255,255,255,0.03),transparent_16%),radial-gradient(circle_at_80%_10%,rgba(255,255,255,0.025),transparent_14%),linear-gradient(180deg,#020202_0%,#060606_45%,#0a0a0a_100%)] text-foreground"
    >
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:48px_48px] opacity-30" />
      <Navbar />
      <main className="mx-auto max-w-7xl px-6 py-10 sm:py-14">{children}</main>
      <Footer />
    </div>
  );
}
