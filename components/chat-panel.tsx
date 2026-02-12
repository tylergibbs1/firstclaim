"use client";

import { useState, useRef, useEffect, useCallback, memo, useMemo } from "react";
import { useChat, useDispatch } from "@/lib/store";
import { useChatStream } from "@/lib/use-chat-stream";
import { ArrowUp, ChevronDown, ChevronRight } from "lucide-react";
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

function SystemMessage({ message }: { message: ChatMessage }) {
  return (
    <div className="py-2 text-center text-[11px] text-muted-foreground/70">
      {message.content}
    </div>
  );
}

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

function ClaimChangeMessage({ message }: { message: ChatMessage }) {
  const change = message.claimChange!;

  return (
    <div className="my-2.5 rounded-xl border border-accent/50 bg-accent/30 px-4 py-3">
      <div className="text-[10px] font-bold uppercase tracking-widest text-accent-foreground/50">
        Claim Updated
      </div>
      <p className="mt-1 text-[13px] text-accent-foreground">
        {change.description}
      </p>
      {change.riskBefore != null &&
        change.riskAfter != null && (
          <div className="mt-1.5 flex items-center gap-1.5 text-[13px]">
            <span className="tabular-nums text-muted-foreground line-through">
              {change.riskBefore}
            </span>
            <span className="text-muted-foreground/50">&rarr;</span>
            <span
              className={`font-semibold tabular-nums ${
                change.riskAfter <
                change.riskBefore
                  ? "text-success"
                  : "text-destructive"
              }`}
            >
              {change.riskAfter}
            </span>
          </div>
        )}
      {change.revenueBefore != null &&
        change.revenueAfter != null && (
          <div className="mt-1 flex items-center gap-1.5 text-[13px]">
            <span className="tabular-nums text-muted-foreground line-through">
              {formatUSD(change.revenueBefore)}
            </span>
            <span className="text-muted-foreground/50">&rarr;</span>
            <span
              className={`font-semibold tabular-nums ${
                change.revenueAfter <
                change.revenueBefore
                  ? "text-success"
                  : "text-destructive"
              }`}
            >
              {formatUSD(change.revenueAfter)} at risk
            </span>
          </div>
        )}
    </div>
  );
}

function AgentBubble({ message }: { message: ChatMessage }) {
  return (
    <div className="flex justify-start mb-3">
      <div className="max-w-[85%] rounded-2xl px-4 py-3 bg-card text-foreground shadow-sm ring-1 ring-border/30">
        <div className="text-[13px] leading-relaxed">
          <Streamdown plugins={{ code }} components={streamdownComponents}>
            {message.content}
          </Streamdown>
        </div>
      </div>
    </div>
  );
}

function UserBubble({ message }: { message: ChatMessage }) {
  return (
    <div className="flex justify-end mb-3">
      <div className="max-w-[85%] rounded-2xl px-4 py-3 bg-primary text-primary-foreground shadow-sm">
        <div className="whitespace-pre-wrap break-words text-[13px] leading-relaxed">
          {message.content}
        </div>
      </div>
    </div>
  );
}

const MessageBubble = memo(function MessageBubble({ message }: { message: ChatMessage }) {
  if (message.role === "system") return <SystemMessage message={message} />;
  if (message.role === "tool") return <ToolMessage message={message} />;
  if (message.claimChange) return <ClaimChangeMessage message={message} />;
  if (message.role === "agent") return <AgentBubble message={message} />;
  return <UserBubble message={message} />;
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
  const { messages, pendingFixMessage } = useChat();
  const dispatch = useDispatch();
  const { sendMessage, isSending } = useChatStream();
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const fixInFlightRef = useRef(false);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const userScrolledRef = useRef(false);

  const lastPrompts = useMemo(
    () => [...messages].reverse().find((m) => m.suggestedPrompts?.length)?.suggestedPrompts,
    [messages]
  );

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const threshold = 40;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < threshold;
    setIsAtBottom(atBottom);
    userScrolledRef.current = !atBottom;
  }, []);

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      userScrolledRef.current = false;
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }
  }, []);

  useEffect(() => {
    if (!userScrolledRef.current && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, lastPrompts]);

  const sendMessageRef = useRef(sendMessage);
  sendMessageRef.current = sendMessage;
  const isSendingRef = useRef(isSending);
  isSendingRef.current = isSending;

  useEffect(() => {
    if (pendingFixMessage && !fixInFlightRef.current) {
      fixInFlightRef.current = true;
      dispatch({ type: "CLEAR_PENDING_FIX_MESSAGE" });
      setInput("");
      sendMessageRef.current(pendingFixMessage).finally(() => {
        fixInFlightRef.current = false;
      });
    }
  }, [pendingFixMessage, dispatch]);

  const handleSend = useCallback((text?: string) => {
    if (isSendingRef.current) return;
    const content = text || input.trim();
    if (!content) return;
    setInput("");
    sendMessageRef.current(content);
  }, [input]);

  return (
    <div className="flex h-full flex-col bg-background/50">
      <div ref={scrollRef} onScroll={handleScroll} className="relative flex-1 overflow-y-auto px-4 py-5" aria-live="polite" aria-relevant="additions">
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

      <div className="relative border-t border-border/40 bg-card/80 p-3 backdrop-blur-md">
        <button
          onClick={scrollToBottom}
          aria-label="Scroll to bottom"
          className={`absolute -top-11 left-1/2 z-10 flex h-8 w-8 -translate-x-1/2 items-center justify-center rounded-full border border-border/50 bg-card shadow-md transition-all duration-150 ease-out hover:bg-muted ${
            isAtBottom
              ? "pointer-events-none translate-y-2 scale-95 opacity-0"
              : "translate-y-0 scale-100 opacity-100"
          }`}
        >
          <ChevronDown className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
        </button>
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
