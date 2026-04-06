import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Zap, Send } from "lucide-react";
import { sendRpc } from "@/lib/routex-api";

interface ProbeResult {
  provider: string;
  duration: number;
  blockhash?: string;
  attempts?: string | null;
  strategy?: string | null;
  methods?: Array<{ name: string; value: string }>;
  error?: string;
}

export function ManualProbe() {
  const [result, setResult] = useState<ProbeResult | null>(null);
  const [loading, setLoading] = useState(false);

  const runProbe = async (type: 'blockhash' | 'mixed') => {
    setLoading(true);
    setResult(null);

    try {
      if (type === 'blockhash') {
        const response = await sendRpc({
          jsonrpc: "2.0",
          id: 1,
          method: "getLatestBlockhash",
        });
        const blockhash =
          response.body?.result?.value?.blockhash ??
          response.body?.result?.blockhash ??
          "n/a";
        setResult({
          provider: response.provider,
          duration: response.durationMs,
          attempts: response.attempts,
          strategy: response.strategy,
          blockhash: typeof blockhash === "string" ? `${blockhash.slice(0, 12)}...` : "n/a",
        });
      } else {
        const requests = [
          { jsonrpc: "2.0", id: "getSlot", method: "getSlot", params: [{ commitment: "processed" }] },
          { jsonrpc: "2.0", id: "getLatestBlockhash", method: "getLatestBlockhash", params: [{ commitment: "processed" }] },
          { jsonrpc: "2.0", id: "getBlockHeight", method: "getBlockHeight", params: [{ commitment: "processed" }] },
          { jsonrpc: "2.0", id: "getBalance", method: "getBalance", params: ["11111111111111111111111111111111", { commitment: "processed" }] },
          {
            jsonrpc: "2.0",
            id: "getMultipleAccounts",
            method: "getMultipleAccounts",
            params: [
              [
                "11111111111111111111111111111111",
                "Stake11111111111111111111111111111111111111",
              ],
              { commitment: "processed", encoding: "base64" },
            ],
          },
        ] as const;

        const summaries: Array<{ name: string; value: string }> = [];
        let totalDuration = 0;
        let provider = "unknown";
        let attempts: string | null = null;
        let strategy: string | null = null;

        for (const payload of requests) {
          const response = await sendRpc(payload);
          totalDuration += response.durationMs;
          provider = response.provider;
          attempts = response.attempts;
          strategy = response.strategy;

          if (payload.method === "getLatestBlockhash") {
            const blockhash =
              response.body?.result?.value?.blockhash ??
              response.body?.result?.blockhash ??
              "ok";
            summaries.push({
              name: payload.method,
              value: typeof blockhash === "string" ? `${blockhash.slice(0, 12)}...` : "ok",
            });
            continue;
          }

          if (payload.method === "getBalance") {
            summaries.push({
              name: payload.method,
              value: String(response.body?.result?.value ?? "ok"),
            });
            continue;
          }

          if (payload.method === "getMultipleAccounts") {
            const count = Array.isArray(response.body?.result?.value)
              ? response.body.result.value.length
              : 0;
            summaries.push({
              name: payload.method,
              value: `${count} accounts`,
            });
            continue;
          }

          summaries.push({
            name: payload.method,
            value: "ok",
          });
        }

        setResult({
          provider,
          duration: totalDuration,
          attempts,
          strategy,
          methods: summaries,
        });
      }
    } catch (error) {
      setResult({
        provider: "unknown",
        duration: 0,
        error: error instanceof Error ? error.message : "Probe failed",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="micro-label text-xs">Manual Probe</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => runProbe('blockhash')} disabled={loading} className="flex-1 font-mono text-xs">
            <Zap className="w-3.5 h-3.5 mr-1.5" />
            Probe blockhash
          </Button>
          <Button variant="outline" size="sm" onClick={() => runProbe('mixed')} disabled={loading} className="flex-1 font-mono text-xs">
            <Send className="w-3.5 h-3.5 mr-1.5" />
            Send 5 mixed
          </Button>
        </div>

        {loading && (
          <div className="text-center py-4">
            <div className="w-5 h-5 border-2 border-muted-foreground/30 border-t-foreground rounded-full animate-spin mx-auto" />
            <p className="text-xs text-muted-foreground mt-2 font-mono">Probing…</p>
          </div>
        )}

        {!loading && result && (
          <div className="bg-secondary rounded-md p-3 space-y-1.5">
            <div className="flex justify-between text-xs font-mono">
              <span className="text-muted-foreground">provider</span>
              <span className="font-semibold text-foreground">{result.provider}</span>
            </div>
            <div className="flex justify-between text-xs font-mono">
              <span className="text-muted-foreground">duration</span>
              <span className="text-foreground">{result.duration}ms</span>
            </div>
            {result.attempts && (
              <div className="flex justify-between text-xs font-mono">
                <span className="text-muted-foreground">attempts</span>
                <span className="text-foreground">{result.attempts}</span>
              </div>
            )}
            {result.strategy && (
              <div className="flex justify-between text-xs font-mono">
                <span className="text-muted-foreground">strategy</span>
                <span className="text-foreground">{result.strategy}</span>
              </div>
            )}
            {result.blockhash && (
              <div className="flex justify-between text-xs font-mono">
                <span className="text-muted-foreground">blockhash</span>
                <span className="text-muted-foreground">{result.blockhash}</span>
              </div>
            )}
            {result.error && (
              <div className="text-xs font-mono text-destructive">{result.error}</div>
            )}
            {result.methods?.map(m => (
              <div key={m.name} className="flex justify-between text-xs font-mono">
                <span className="text-muted-foreground">{m.name}</span>
                <span className="text-muted-foreground">{m.value}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
