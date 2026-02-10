"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Download, RefreshCw, Code2, X } from "lucide-react";

export function ActionBar() {
  const { claim } = useStore();
  const [showJson, setShowJson] = useState(false);

  if (!claim) return null;

  return (
    <>
      {showJson && (
        <div className="border-t border-border/40 bg-card">
          <div className="flex items-center justify-between border-b border-border/30 px-4 py-2">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Claim JSON
            </span>
            <button
              onClick={() => setShowJson(false)}
              aria-label="Close JSON preview"
              className="rounded-md p-1 text-muted-foreground/50 transition-colors hover:bg-muted hover:text-muted-foreground"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
          <pre className="max-h-56 overflow-auto p-4 font-mono text-[11px] leading-relaxed text-foreground/80">
            {JSON.stringify(claim, null, 2)}
          </pre>
        </div>
      )}

      <div className="sticky bottom-0 flex items-center gap-2 bg-card/90 px-4 py-3 backdrop-blur-md">
        <Button size="sm" className="h-8 gap-1.5 rounded-xl px-4 text-xs shadow-sm">
          <Download className="h-3 w-3" aria-hidden="true" />
          Export
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="h-8 gap-1.5 rounded-xl border-tertiary/30 px-4 text-xs text-tertiary hover:bg-tertiary/5 hover:text-tertiary"
        >
          <RefreshCw className="h-3 w-3" aria-hidden="true" />
          Re-validate
        </Button>
        <button
          onClick={() => setShowJson(!showJson)}
          aria-expanded={showJson}
          className="ml-auto flex items-center gap-1.5 text-[11px] text-muted-foreground/60 transition-colors hover:text-muted-foreground"
        >
          <Code2 className="h-3 w-3" aria-hidden="true" />
          {showJson ? "Hide" : "JSON"}
        </button>
      </div>
    </>
  );
}
