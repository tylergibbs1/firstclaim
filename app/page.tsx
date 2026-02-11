"use client";

import { useEffect } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { LoginScreen } from "@/components/login-screen";
import { useStore } from "@/lib/store";
import { TopBar } from "@/components/top-bar";
import { InputState } from "@/components/input-state";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

const AnalysisState = dynamic(() =>
  import("@/components/analysis-state").then((m) => ({ default: m.AnalysisState }))
);
const ClaimWorkspace = dynamic(() =>
  import("@/components/claim-workspace").then((m) => ({ default: m.ClaimWorkspace }))
);
const ChatPanel = dynamic(() =>
  import("@/components/chat-panel").then((m) => ({ default: m.ChatPanel }))
);

const transition = { duration: 0.25, ease: [0.25, 0.1, 0.25, 1] as const };

export default function Page() {
  const { user, isLoading } = useAuth();
  const { appState, sessionId } = useStore();
  const router = useRouter();
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (appState === "conversation" && sessionId) {
      router.replace(`/sessions/${sessionId}`);
    }
  }, [appState, sessionId, router]);

  if (isLoading) {
    return (
      <div className="flex h-dvh items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
      </div>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  const motionProps = reducedMotion
    ? {}
    : {
        initial: { opacity: 0, y: 8 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -8 },
        transition,
      };

  return (
    <div className="flex h-dvh flex-col">
      <TopBar />

      <main id="main-content" className="flex flex-1 flex-col overflow-hidden" aria-live="polite">
        <AnimatePresence mode="wait">
          {appState === "input" ? (
            <motion.div key="input" className="flex flex-1 flex-col" {...motionProps}>
              <InputState />
            </motion.div>
          ) : appState === "analyzing" ? (
            <motion.div key="analyzing" className="flex flex-1 flex-col" {...motionProps}>
              <AnalysisState />
            </motion.div>
          ) : (
            <motion.div key="conversation" className="flex flex-1 overflow-hidden" {...motionProps}>
              {/* Left panel: Claim workspace */}
              <div className="flex flex-[58] flex-col">
                <ClaimWorkspace />
              </div>

              {/* Right panel: Conversation */}
              <div className="flex flex-[42] flex-col border-l border-border/40">
                <ChatPanel />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
