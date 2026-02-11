"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useDispatch } from "@/lib/store";
import { useAuth } from "@/components/auth-provider";
import { consumeSSE } from "@/lib/sse";
import type { AnalysisStage } from "@/lib/types";

export function useAnalysisStream() {
  const dispatch = useDispatch();
  const router = useRouter();
  const { session } = useAuth();
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  async function startAnalysis(notes: string) {
    if (!notes.trim() || isAnalyzing) return;
    setIsAnalyzing(true);

    dispatch({ type: "SET_CLINICAL_NOTES", notes });
    dispatch({ type: "SET_APP_STATE", state: "analyzing" });
    dispatch({ type: "SET_ANALYSIS_STAGE", stage: 1 as AnalysisStage });

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session?.access_token && {
            Authorization: `Bearer ${session.access_token}`,
          }),
        },
        body: JSON.stringify({ clinicalNotes: notes }),
      });

      if (!res.ok || !res.body) {
        throw new Error(`API error: ${res.status}`);
      }

      await consumeSSE(res.body, (event) => {
        switch (event.type) {
          case "stage":
            dispatch({
              type: "SET_ANALYSIS_STAGE",
              stage: Math.min(event.stage, 5) as AnalysisStage,
            });
            break;
          case "claim_built":
            dispatch({ type: "SET_CLAIM", claim: event.claim });
            break;
          case "risk_score":
            dispatch({ type: "UPDATE_RISK_SCORE", score: event.score });
            break;
          case "tool_call":
            dispatch({
              type: "SET_ANALYSIS_TOOL_ACTIVITY",
              tool: event.tool,
              query: event.query || "",
            });
            break;
          case "tool_result":
            dispatch({
              type: "SET_ANALYSIS_TOOL_RESULT",
              result: event.result,
            });
            break;
          case "highlights":
            dispatch({
              type: "SET_NOTE_HIGHLIGHTS",
              highlights: event.highlights,
            });
            break;
          case "analysis_complete":
            dispatch({
              type: "SET_SESSION_ID",
              sessionId: event.sessionId,
            });
            if (event.claim) {
              dispatch({ type: "SET_CLAIM", claim: event.claim });
            }
            if (event.highlights) {
              dispatch({
                type: "SET_NOTE_HIGHLIGHTS",
                highlights: event.highlights,
              });
            }
            dispatch({
              type: "ADD_MESSAGE",
              message: {
                id: `agent-${Date.now()}`,
                role: "agent",
                content: event.summary,
                timestamp: new Date(),
                suggestedPrompts: event.suggestedPrompts,
              },
            });
            dispatch({
              type: "SET_ANALYSIS_STAGE",
              stage: 5 as AnalysisStage,
            });
            dispatch({ type: "SET_APP_STATE", state: "conversation" });
            router.replace(`/sessions/${event.sessionId}`);
            break;
          case "error":
            console.error("Analysis error:", event.message);
            dispatch({ type: "SET_APP_STATE", state: "input" });
            break;
        }
      });
    } catch (err) {
      console.error("Analyze fetch error:", err);
      dispatch({ type: "SET_APP_STATE", state: "input" });
    } finally {
      setIsAnalyzing(false);
    }
  }

  return { startAnalysis, isAnalyzing };
}
