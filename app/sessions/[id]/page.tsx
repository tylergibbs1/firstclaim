"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { useAuth } from "@/components/auth-provider";
import { LoginScreen } from "@/components/login-screen";
import { useApp, useDispatch } from "@/lib/store";
import { TopBar } from "@/components/top-bar";
import { transformDbMessages } from "@/lib/session-helpers";

const ClaimWorkspace = dynamic(() =>
  import("@/components/claim-workspace").then((m) => ({ default: m.ClaimWorkspace }))
);
const ChatPanel = dynamic(() =>
  import("@/components/chat-panel").then((m) => ({ default: m.ChatPanel }))
);

export default function SessionPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, session: authSession, isLoading: authLoading } = useAuth();
  const { sessionId, appState } = useApp();
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Already have this session loaded in the store
    if (sessionId === id && appState === "conversation") {
      setLoading(false);
      return;
    }

    const token = authSession?.access_token;
    if (!token) return;

    let cancelled = false;

    async function fetchSession() {
      try {
        const res = await fetch(`/api/sessions/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok || cancelled) {
          if (!cancelled) router.replace("/");
          return;
        }
        const { session, messages: dbMessages } = await res.json();
        if (cancelled) return;

        dispatch({
          type: "RESTORE_SESSION",
          sessionId: session.id,
          clinicalNotes: session.clinical_notes ?? "",
          claim: session.claim,
          highlights: session.highlights ?? [],
          messages: transformDbMessages(dbMessages),
        });
      } catch {
        if (!cancelled) router.replace("/");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchSession();
    return () => { cancelled = true; };
  }, [id, sessionId, appState, authSession?.access_token, dispatch, router]);

  if (authLoading || loading) {
    return (
      <div className="flex h-dvh items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
      </div>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  return (
    <div className="flex h-dvh flex-col">
      <TopBar />
      <main id="main-content" className="flex flex-1 overflow-hidden" aria-live="polite">
        <div className="flex flex-[58] flex-col">
          <ClaimWorkspace />
        </div>
        <div className="flex flex-[42] flex-col border-l border-border/40">
          <ChatPanel />
        </div>
      </main>
    </div>
  );
}
