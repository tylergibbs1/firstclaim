"use client";

import { useState, useRef, useEffect, memo, useMemo } from "react";
import { useStore, useDispatch } from "@/lib/store";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { ArrowUp, ChevronRight } from "lucide-react";
import { Shimmer } from "@/components/ui/shimmer";
import { Streamdown } from "streamdown";
import { code } from "@streamdown/code";
import type { ChatMessage } from "@/lib/types";
import { formatUSD } from "@/lib/fee-schedule";
import type { ComponentPropsWithoutRef } from "react";

const streamdownComponents = {
  p: (props: ComponentPropsWithoutRef<"p">) => (
    <p className="my-1" {...props} />
  ),
  ul: (props: ComponentPropsWithoutRef<"ul">) => (
    <ul className="my-1 list-disc pl-4" {...props} />
  ),
  ol: (props: ComponentPropsWithoutRef<"ol">) => (
    <ol className="my-1 list-decimal pl-4" {...props} />
  ),
  li: (props: ComponentPropsWithoutRef<"li">) => (
    <li className="my-0.5" {...props} />
  ),
  strong: (props: ComponentPropsWithoutRef<"strong">) => (
    <strong className="font-semibold" {...props} />
  ),
  code: (props: ComponentPropsWithoutRef<"code">) => (
    <code className="rounded bg-muted/50 px-1 py-0.5 text-[12px]" {...props} />
  ),
};

function ToolMessage({ message }: { message: ChatMessage }) {
  const [expanded, setExpanded] = useState(false);
  const isSearching = message.toolActivity?.status === "searching";
  const result = message.toolActivity?.result;

  return (
    <div className="py-1.5 pl-1">
      <div className="flex items-center gap-2">
        <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-purple" />
        {isSearching ? (
          <Shimmer as="span" className="text-[12px]" duration={2} spread={2}>
            {message.content}
          </Shimmer>
        ) : (
          <span className="text-[12px] text-muted-foreground">
            {message.content}
          </span>
        )}
        {result && (
          <button
            onClick={() => setExpanded((v) => !v)}
            aria-label={expanded ? "Collapse tool result" : "Expand tool result"}
            aria-expanded={expanded}
            className="flex items-center gap-0.5 text-[11px] text-muted-foreground/60 transition-colors hover:text-muted-foreground"
          >
            <ChevronRight
              className={`h-3 w-3 transition-transform ${expanded ? "rotate-90" : ""}`}
            />
          </button>
        )}
      </div>
      {expanded && result && (
        <div className="ml-5 mt-1 rounded-md border border-border/40 bg-muted/30 px-2.5 py-1.5 text-[11px] leading-relaxed text-muted-foreground animate-in fade-in slide-in-from-top-1 duration-150">
          {result}
        </div>
      )}
    </div>
  );
}

const MessageBubble = memo(function MessageBubble({ message }: { message: ChatMessage }) {
  if (message.role === "system") {
    return (
      <div className="py-2 text-center text-[11px] text-muted-foreground/70">
        {message.content}
      </div>
    );
  }

  if (message.role === "tool") {
    return <ToolMessage message={message} />;
  }

  const isAgent = message.role === "agent";

  if (message.claimChange) {
    return (
      <div className="my-2.5 rounded-xl border border-accent/50 bg-accent/30 px-4 py-3">
        <div className="text-[10px] font-bold uppercase tracking-widest text-accent-foreground/50">
          Claim Updated
        </div>
        <p className="mt-1 text-[13px] text-accent-foreground">
          {message.claimChange.description}
        </p>
        {message.claimChange.riskBefore != null &&
          message.claimChange.riskAfter != null && (
            <div className="mt-1.5 flex items-center gap-1.5 text-[13px]">
              <span className="tabular-nums text-muted-foreground line-through">
                {message.claimChange.riskBefore}
              </span>
              <span className="text-muted-foreground/50">&rarr;</span>
              <span
                className={`font-semibold tabular-nums ${
                  message.claimChange.riskAfter <
                  message.claimChange.riskBefore
                    ? "text-success"
                    : "text-destructive"
                }`}
              >
                {message.claimChange.riskAfter}
              </span>
            </div>
          )}
        {message.claimChange.revenueBefore != null &&
          message.claimChange.revenueAfter != null && (
            <div className="mt-1 flex items-center gap-1.5 text-[13px]">
              <span className="tabular-nums text-muted-foreground line-through">
                {formatUSD(message.claimChange.revenueBefore)}
              </span>
              <span className="text-muted-foreground/50">&rarr;</span>
              <span
                className={`font-semibold tabular-nums ${
                  message.claimChange.revenueAfter <
                  message.claimChange.revenueBefore
                    ? "text-success"
                    : "text-destructive"
                }`}
              >
                {formatUSD(message.claimChange.revenueAfter)} at risk
              </span>
            </div>
          )}
      </div>
    );
  }

  return (
    <div className={`flex ${isAgent ? "justify-start" : "justify-end"} mb-3`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 ${
          isAgent
            ? "bg-card text-foreground shadow-sm ring-1 ring-border/30"
            : "bg-primary text-primary-foreground shadow-sm"
        }`}
      >
        {isAgent ? (
          <div className="text-[13px] leading-relaxed">
            <Streamdown plugins={{ code }} components={streamdownComponents}>
              {message.content}
            </Streamdown>
          </div>
        ) : (
          <div className="whitespace-pre-wrap break-words text-[13px] leading-relaxed">
            {message.content}
          </div>
        )}
      </div>
    </div>
  );
});

function SuggestedPrompts({
  prompts,
  onSelect,
}: {
  prompts: string[];
  onSelect: (p: string) => void;
}) {
  return (
    <div className="mt-1 mb-4 flex flex-wrap gap-1.5 px-1 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {prompts.map((prompt) => (
        <button
          key={prompt}
          onClick={() => onSelect(prompt)}
          className="rounded-xl border border-border/50 bg-card px-3 py-1.5 text-[11px] font-medium text-foreground/70 shadow-xs transition-colors hover:border-primary/30 hover:bg-primary/5 hover:text-primary"
        >
          {prompt}
        </button>
      ))}
    </div>
  );
}

export function ChatPanel() {
  const { messages, sessionId, pendingFixMessage } = useStore();
  const dispatch = useDispatch();
  const { session } = useAuth();
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fixInFlightRef = useRef(false);

  const lastPrompts = useMemo(
    () => [...messages].reverse().find((m) => m.suggestedPrompts?.length)?.suggestedPrompts,
    [messages]
  );

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, lastPrompts]);

  useEffect(() => {
    if (pendingFixMessage && !fixInFlightRef.current) {
      fixInFlightRef.current = true;
      dispatch({ type: "CLEAR_PENDING_FIX_MESSAGE" });
      handleSend(pendingFixMessage).finally(() => {
        fixInFlightRef.current = false;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingFixMessage]);

  async function handleSend(text?: string) {
    const content = text || input.trim();
    if (!content || isSending) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content,
      timestamp: new Date(),
    };
    dispatch({ type: "ADD_MESSAGE", message: userMsg });
    setInput("");

    // If no sessionId (demo mode), use mock response
    if (!sessionId) {
      setTimeout(() => {
        const toolMsg: ChatMessage = {
          id: `tool-${Date.now()}`,
          role: "tool",
          content: "Searching CMS guidelines...",
          timestamp: new Date(),
          toolActivity: {
            tool: "WebSearch",
            query: content,
            status: "searching",
          },
        };
        dispatch({ type: "ADD_MESSAGE", message: toolMsg });
      }, 500);

      setTimeout(() => {
        const agentMsg: ChatMessage = {
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
        };
        dispatch({ type: "ADD_MESSAGE", message: agentMsg });
      }, 2000);
      return;
    }

    // Real agent chat via SSE
    setIsSending(true);

    // Show searching indicator
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

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session?.access_token && { Authorization: `Bearer ${session.access_token}` }),
        },
        body: JSON.stringify({ sessionId, message: content }),
      });

      if (!res.ok || !res.body) {
        throw new Error(`API error: ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let agentText = "";
      let currentToolMsgId = toolMsgId; // reuse "Thinking..." for the first tool
      let currentToolName = "";
      let thinkingReplaced = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6);
          try {
            const event = JSON.parse(json);

            switch (event.type) {
              case "agent_text":
                agentText += event.text;
                break;
              case "tool_call": {
                const toolLabel = event.tool.replace(/_/g, " ");
                const content = event.query
                  ? `${toolLabel}: ${event.query}`
                  : toolLabel;

                if (event.tool === currentToolName) {
                  // Same tool — update query as it streams
                  dispatch({
                    type: "UPDATE_MESSAGE",
                    id: currentToolMsgId,
                    updates: {
                      content,
                      toolActivity: { tool: event.tool, query: event.query, status: "searching" as const },
                    },
                  });
                } else if (!thinkingReplaced) {
                  // First tool — replace "Thinking..." message
                  thinkingReplaced = true;
                  currentToolName = event.tool;
                  dispatch({
                    type: "UPDATE_MESSAGE",
                    id: currentToolMsgId,
                    updates: {
                      content,
                      toolActivity: { tool: event.tool, query: event.query, status: "searching" as const },
                    },
                  });
                } else {
                  // Subsequent new tool — create a new message
                  const id = `tool-${Date.now()}-${Math.random()}`;
                  currentToolMsgId = id;
                  currentToolName = event.tool;
                  dispatch({
                    type: "ADD_MESSAGE",
                    message: {
                      id,
                      role: "tool",
                      content,
                      timestamp: new Date(),
                      toolActivity: { tool: event.tool, query: event.query, status: "searching" },
                    },
                  });
                }
                break;
              }
              case "tool_result": {
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
              }
              case "claim_updated":
                dispatch({ type: "SET_CLAIM", claim: event.claim });
                break;
              case "risk_score_updated":
                dispatch({ type: "UPDATE_RISK_SCORE", score: event.score });
                break;
              case "chat_complete":
                // Clean up: remove "Thinking..." if no tools ran, or mark last tool complete
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
          } catch {
            // skip malformed JSON
          }
        }
      }
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

  return (
    <div className="flex h-full flex-col bg-background/50">
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-5" aria-live="polite" aria-relevant="additions">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        {lastPrompts && !isSending && (
          <SuggestedPrompts
            prompts={lastPrompts}
            onSelect={(p) => handleSend(p)}
          />
        )}
      </div>

      <div className="border-t border-border/40 bg-card/80 p-3 backdrop-blur-md">
        <div className="flex items-center gap-2 rounded-xl border border-border/50 bg-card px-3 py-1 shadow-sm ring-1 ring-border/10 focus-within:ring-2 focus-within:ring-purple/20">
          <label htmlFor="chat-input" className="sr-only">
            Message
          </label>
          <input
            id="chat-input"
            type="text"
            name="message"
            autoComplete="off"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Ask about the claim, request changes…"
            className="flex-1 bg-transparent py-2 text-[13px] placeholder:text-muted-foreground/50 outline-none"
            disabled={isSending}
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || isSending}
            aria-label="Send message"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 disabled:opacity-30"
          >
            <ArrowUp className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
