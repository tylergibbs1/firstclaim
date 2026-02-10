"use client";

import { useState, useRef, useEffect } from "react";
import { useStore, useDispatch } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { ArrowUp } from "lucide-react";
import { Shimmer } from "@/components/ui/shimmer";
import type { ChatMessage } from "@/lib/types";
import { formatUSD } from "@/lib/fee-schedule";

function MessageBubble({ message }: { message: ChatMessage }) {
  if (message.role === "system") {
    return (
      <div className="py-2 text-center text-[11px] text-muted-foreground/70">
        {message.content}
      </div>
    );
  }

  if (message.role === "tool") {
    const isSearching = message.toolActivity?.status === "searching";
    return (
      <div className="flex items-center gap-2 py-2 pl-1">
        <div className="h-1.5 w-1.5 rounded-full bg-purple" />
        {isSearching ? (
          <Shimmer as="span" className="text-[12px]" duration={2} spread={2}>
            {message.content}
          </Shimmer>
        ) : (
          <span className="text-[12px] text-muted-foreground">
            {message.content}
          </span>
        )}
      </div>
    );
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
        <div className="whitespace-pre-wrap break-words text-[13px] leading-relaxed">
          {message.content.split(/(\*\*.*?\*\*)/).map((part, i) => {
            if (part.startsWith("**") && part.endsWith("**")) {
              return (
                <strong key={i} className="font-semibold">
                  {part.slice(2, -2)}
                </strong>
              );
            }
            return part;
          })}
        </div>
      </div>
    </div>
  );
}

function SuggestedPrompts({
  prompts,
  onSelect,
}: {
  prompts: string[];
  onSelect: (p: string) => void;
}) {
  return (
    <div className="mt-1 mb-4 flex flex-wrap gap-1.5 px-1">
      {prompts.map((prompt) => (
        <button
          key={prompt}
          onClick={() => onSelect(prompt)}
          className="rounded-xl border border-border/50 bg-card px-3 py-1.5 text-[11px] font-medium text-foreground/70 shadow-xs transition-all hover:border-primary/30 hover:bg-primary/5 hover:text-primary"
        >
          {prompt}
        </button>
      ))}
    </div>
  );
}

export function ChatPanel() {
  const { messages } = useStore();
  const dispatch = useDispatch();
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  function handleSend(text?: string) {
    const content = text || input.trim();
    if (!content) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content,
      timestamp: new Date(),
    };
    dispatch({ type: "ADD_MESSAGE", message: userMsg });
    setInput("");

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
  }

  const lastPrompts = [...messages]
    .reverse()
    .find((m) => m.suggestedPrompts?.length)?.suggestedPrompts;

  return (
    <div className="flex h-full flex-col bg-background/50">
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-5">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        {lastPrompts && (
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
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Ask about the claim, request changes…"
            className="flex-1 bg-transparent py-2 text-[13px] placeholder:text-muted-foreground/50 focus:outline-none"
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim()}
            aria-label="Send message"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm transition-all hover:bg-primary/90 disabled:opacity-30"
          >
            <ArrowUp className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
