"use client";

import { useState } from "react";
import { useStore, useDispatch } from "@/lib/store";
import { useAuth } from "@/components/auth-provider";
import { consumeSSE } from "@/lib/sse";
import type { ChatMessage } from "@/lib/types";

export function useChatStream() {
  const { sessionId } = useStore();
  const dispatch = useDispatch();
  const { session } = useAuth();
  const [isSending, setIsSending] = useState(false);

  async function sendMessage(content: string) {
    if (!content || isSending) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content,
      timestamp: new Date(),
    };
    dispatch({ type: "ADD_MESSAGE", message: userMsg });

    // Demo mode — no real session
    if (!sessionId) {
      setTimeout(() => {
        dispatch({
          type: "ADD_MESSAGE",
          message: {
            id: `tool-${Date.now()}`,
            role: "tool",
            content: "Searching CMS guidelines...",
            timestamp: new Date(),
            toolActivity: {
              tool: "WebSearch",
              query: content,
              status: "searching",
            },
          },
        });
      }, 500);

      setTimeout(() => {
        dispatch({
          type: "ADD_MESSAGE",
          message: {
            id: `agent-${Date.now()}`,
            role: "agent",
            content:
              "I understand your question. In a live session, I would search CMS guidelines and the ICD-10 database to give you a detailed answer with source citations. This is a demo preview of the conversation interface.",
            timestamp: new Date(),
            suggestedPrompts: [
              "Tell me more",
              "What else should I check?",
              "Export the claim",
            ],
          },
        });
      }, 2000);
      return;
    }

    // Real agent chat via SSE
    setIsSending(true);

    const toolMsgId = `tool-${Date.now()}`;
    dispatch({
      type: "ADD_MESSAGE",
      message: {
        id: toolMsgId,
        role: "tool",
        content: "Thinking...",
        timestamp: new Date(),
        toolActivity: { tool: "agent", query: content, status: "searching" },
      },
    });

    let agentText = "";
    let currentToolMsgId = toolMsgId;
    let currentToolName = "";
    let thinkingReplaced = false;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session?.access_token && {
            Authorization: `Bearer ${session.access_token}`,
          }),
        },
        body: JSON.stringify({ sessionId, message: content }),
      });

      if (!res.ok || !res.body) {
        throw new Error(`API error: ${res.status}`);
      }

      await consumeSSE(res.body, (event) => {
        switch (event.type) {
          case "agent_text":
            agentText += event.text;
            break;
          case "tool_call": {
            const toolLabel = (event.tool as string).replace(/_/g, " ");
            const toolContent = event.query
              ? `${toolLabel}: ${event.query}`
              : toolLabel;

            if (event.tool === currentToolName) {
              dispatch({
                type: "UPDATE_MESSAGE",
                id: currentToolMsgId,
                updates: {
                  content: toolContent,
                  toolActivity: {
                    tool: event.tool,
                    query: event.query,
                    status: "searching" as const,
                  },
                },
              });
            } else if (!thinkingReplaced) {
              thinkingReplaced = true;
              currentToolName = event.tool;
              dispatch({
                type: "UPDATE_MESSAGE",
                id: currentToolMsgId,
                updates: {
                  content: toolContent,
                  toolActivity: {
                    tool: event.tool,
                    query: event.query,
                    status: "searching" as const,
                  },
                },
              });
            } else {
              const id = `tool-${Date.now()}-${Math.random()}`;
              currentToolMsgId = id;
              currentToolName = event.tool;
              dispatch({
                type: "ADD_MESSAGE",
                message: {
                  id,
                  role: "tool",
                  content: toolContent,
                  timestamp: new Date(),
                  toolActivity: {
                    tool: event.tool,
                    query: event.query,
                    status: "searching",
                  },
                },
              });
            }
            break;
          }
          case "tool_result":
            if (currentToolMsgId) {
              dispatch({
                type: "UPDATE_MESSAGE",
                id: currentToolMsgId,
                updates: {
                  toolActivity: {
                    tool: currentToolName,
                    query: "",
                    status: "complete" as const,
                    result: event.result,
                  },
                },
              });
            }
            break;
          case "claim_updated":
            dispatch({ type: "SET_CLAIM", claim: event.claim });
            break;
          case "risk_score_updated":
            dispatch({ type: "UPDATE_RISK_SCORE", score: event.score });
            break;
          case "chat_complete":
            if (!thinkingReplaced) {
              dispatch({ type: "REMOVE_MESSAGE", id: toolMsgId });
            }
            dispatch({ type: "COMPLETE_ALL_TOOL_ACTIVITY" });
            dispatch({
              type: "ADD_MESSAGE",
              message: {
                id: `agent-${Date.now()}`,
                role: "agent",
                content: agentText || event.summary,
                timestamp: new Date(),
                suggestedPrompts: event.suggestedPrompts,
              },
            });
            break;
          case "error":
            if (!thinkingReplaced) {
              dispatch({ type: "REMOVE_MESSAGE", id: toolMsgId });
            }
            dispatch({ type: "COMPLETE_ALL_TOOL_ACTIVITY" });
            dispatch({
              type: "ADD_MESSAGE",
              message: {
                id: `agent-${Date.now()}`,
                role: "agent",
                content: `Something went wrong: ${event.message}`,
                timestamp: new Date(),
              },
            });
            break;
        }
      });
    } catch (err) {
      console.error("Chat fetch error:", err);
      dispatch({
        type: "ADD_MESSAGE",
        message: {
          id: `agent-${Date.now()}`,
          role: "agent",
          content: "Sorry, I encountered an error. Please try again.",
          timestamp: new Date(),
        },
      });
    } finally {
      setIsSending(false);
    }
  }

  return { sendMessage, isSending };
}
