"use client";

import { useStore } from "@/lib/store";
import { TopBar } from "@/components/top-bar";
import { InputState } from "@/components/input-state";
import { AnalysisState } from "@/components/analysis-state";
import { ClaimWorkspace } from "@/components/claim-workspace";
import { ChatPanel } from "@/components/chat-panel";

export default function Page() {
  const { appState } = useStore();

  return (
    <div className="flex h-dvh flex-col">
      <TopBar />

      {appState === "input" && <InputState />}

      {appState === "analyzing" && <AnalysisState />}

      {appState === "conversation" && (
        <div className="flex flex-1 overflow-hidden">
          {/* Left panel: Claim workspace — 58% */}
          <div className="flex w-[58%] flex-col">
            <ClaimWorkspace />
          </div>

          {/* Right panel: Conversation — 42% */}
          <div className="flex w-[42%] flex-col border-l border-border/40">
            <ChatPanel />
          </div>
        </div>
      )}
    </div>
  );
}
