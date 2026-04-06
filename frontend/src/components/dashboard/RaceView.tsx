import { useRef, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ProviderView } from "@/lib/routex-api";

interface RaceViewProps {
  providers: ProviderView[];
}

interface RocketState {
  y: number;
  targetY: number;
  trail: number[];
}

const PROVIDER_SYMBOLS = ["Q", "H", "R", "S"];

export function RaceView({ providers }: RaceViewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<Map<string, RocketState>>(new Map());
  const providersRef = useRef(providers);
  const animRef = useRef<number>(0);

  providersRef.current = providers;

  // Update targets when providers change
  useEffect(() => {
    const sorted = [...providers].sort((a, b) => {
      const left = a.latency ?? Number.POSITIVE_INFINITY;
      const right = b.latency ?? Number.POSITIVE_INFINITY;
      return left - right;
    });
    const latencies = sorted
      .map((provider) => provider.latency)
      .filter((value): value is number => value !== null);
    const minLatency = latencies.length > 0 ? Math.min(...latencies) : 0;
    const maxLatency = latencies.length > 0 ? Math.max(...latencies) : 1;

    sorted.forEach((p) => {
      const existing = stateRef.current.get(p.id);
      const latency = p.latency ?? maxLatency;
      const normalizedY =
        maxLatency === minLatency ? 0.5 : (latency - minLatency) / (maxLatency - minLatency);
      if (existing) {
        existing.targetY = normalizedY;
      } else {
        stateRef.current.set(p.id, {
          y: normalizedY,
          targetY: normalizedY,
          trail: Array(60).fill(normalizedY),
        });
      }
    });
  }, [providers]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const W = rect.width;
    const H = rect.height;
    const padTop = 30;
    const padBot = 20;
    const padLeft = 10;
    const padRight = 50;
    const graphH = H - padTop - padBot;
    const graphW = W - padLeft - padRight;

    // Clear
    ctx.clearRect(0, 0, W, H);

    // Grid lines
    ctx.strokeStyle = "rgba(255,255,255,0.06)";
    ctx.lineWidth = 1;
    const latencyValues = providersRef.current
      .map((provider) => provider.latency)
      .filter((value): value is number => value !== null);
    const minLatency = latencyValues.length > 0 ? Math.min(...latencyValues) : 0;
    const maxLatency = latencyValues.length > 0 ? Math.max(...latencyValues) : 100;

    for (let i = 0; i <= 4; i++) {
      const gy = padTop + (graphH * i) / 4;
      ctx.beginPath();
      ctx.moveTo(padLeft, gy);
      ctx.lineTo(padLeft + graphW, gy);
      ctx.stroke();

      // Y-axis labels use actual average latency range.
      const latencyLabel = Math.round(
        minLatency + ((maxLatency - minLatency) * i) / 4,
      );
      ctx.fillStyle = "rgba(255,255,255,0.25)";
      ctx.font = "9px JetBrains Mono, monospace";
      ctx.textAlign = "right";
      ctx.fillText(`${latencyLabel}ms`, padLeft + graphW + 28, gy + 3);
    }

    const sorted = [...providersRef.current].sort((a, b) => {
      const left = a.latency ?? Number.POSITIVE_INFINITY;
      const right = b.latency ?? Number.POSITIVE_INFINITY;
      return left - right;
    });

    sorted.forEach((p, idx) => {
      const state = stateRef.current.get(p.id);
      if (!state) return;

      // Smooth interpolation
      state.y += (state.targetY - state.y) * 0.08;
      state.trail.push(state.y);
      if (state.trail.length > 60) state.trail.shift();

      const color = p.color;
      const trailLen = state.trail.length;

      // Draw trail line
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.globalAlpha = 0.5;
      for (let i = 0; i < trailLen; i++) {
        const x = padLeft + (graphW * i) / 59;
        const y = padTop + state.trail[i] * graphH;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.globalAlpha = 1;

      // Draw rocket at the end
      const rocketX = padLeft + graphW;
      const rocketY = padTop + state.y * graphH;

      // Glow
      if (idx === 0) {
        ctx.beginPath();
        ctx.arc(rocketX, rocketY, 12, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255,255,255,0.06)";
        ctx.fill();
      }

      // Rocket emoji
      ctx.font = "bold 11px JetBrains Mono, monospace";
      ctx.textAlign = "center";
      ctx.fillStyle = p.active ? "#ffffff" : color;
      ctx.fillText(PROVIDER_SYMBOLS[idx] || p.name.slice(0, 1).toUpperCase(), rocketX, rocketY + 4);

      // Label
      ctx.font = "bold 9px JetBrains Mono, monospace";
      ctx.fillStyle = color;
      ctx.textAlign = "left";
      ctx.fillText(p.name, rocketX + 14, rocketY + 4);
    });

    animRef.current = requestAnimationFrame(draw);
  }, []);

  useEffect(() => {
    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [draw]);

  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <CardTitle className="micro-label text-xs">Race View</CardTitle>
      </CardHeader>
      <CardContent className="p-3 pt-0">
        <canvas
          ref={canvasRef}
          className="w-full h-[260px] rounded"
          style={{ imageRendering: "auto" }}
        />
      </CardContent>
    </Card>
  );
}
