import type { SDKMessage } from "@anthropic-ai/claude-agent-sdk";

// Hoisted regex patterns — avoid re-creation per chunk
const RE_QUERY = /"query"\s*:\s*"([^"]*)/;
const RE_CODE = /"code"\s*:\s*"([^"]*)/;
const RE_ACTION = /"action"\s*:\s*"([^"]*)/;

export interface StreamProcessorCallbacks {
  onText(text: string): void;
  onToolStart(toolName: string): void;
  onToolInput(toolName: string, extracted: string): void;
  onAssistantToolUse(toolName: string, input: Record<string, unknown>): void;
  onError(message: string): void;
}

/**
 * Shared processor for SDK stream messages. Handles content block
 * streaming, tool-call extraction, text accumulation (deduplicated
 * via UUID tracking), and result/error detection.
 *
 * Callers provide callbacks for domain-specific logic (stage
 * advancement, finding events, etc.).
 */
export class StreamProcessor {
  accumulatedText = "";
  agentSessionId: string | undefined;

  private inTool = false;
  private toolInputBuffer = "";
  private currentToolName = "";
  /** UUIDs of assistant messages whose text was captured via streaming */
  private streamedTextUuids = new Set<string>();

  constructor(private callbacks: StreamProcessorCallbacks) {}

  /**
   * Process a single SDK message.
   * Returns `true` when the stream is done (result message received).
   */
  process(message: SDKMessage): boolean {
    if (message.type === "system" && message.subtype === "init") {
      this.agentSessionId = message.session_id;
    }

    if (message.type === "stream_event") {
      const { event } = message;

      if (event.type === "content_block_start") {
        if (event.content_block.type === "tool_use") {
          this.inTool = true;
          this.currentToolName = event.content_block.name.replace("mcp__billing__", "");
          this.toolInputBuffer = "";
          this.callbacks.onToolStart(this.currentToolName);
        }
      }

      if (event.type === "content_block_delta") {
        if (event.delta.type === "text_delta" && !this.inTool) {
          this.streamedTextUuids.add(message.uuid);
          this.accumulatedText += event.delta.text;
          this.callbacks.onText(event.delta.text);
        }
        if (event.delta.type === "input_json_delta" && this.inTool) {
          this.toolInputBuffer += event.delta.partial_json;
          const match =
            this.toolInputBuffer.match(RE_QUERY) ||
            this.toolInputBuffer.match(RE_CODE) ||
            this.toolInputBuffer.match(RE_ACTION);
          if (match?.[1]) {
            this.callbacks.onToolInput(this.currentToolName, match[1]);
          }
        }
      }

      if (event.type === "content_block_stop") {
        this.inTool = false;
        this.currentToolName = "";
        this.toolInputBuffer = "";
      }
    }

    if (message.type === "assistant" && message.message?.content) {
      // Emit completed tool-use blocks for domain-specific handling
      for (const block of message.message.content) {
        if (block.type === "tool_use") {
          this.callbacks.onAssistantToolUse(
            block.name.replace("mcp__billing__", ""),
            block.input as Record<string, unknown>,
          );
        }
      }

      // Fallback text accumulation — only for messages not already
      // captured via streaming (tracked by UUID, not .includes())
      if (!this.streamedTextUuids.has(message.uuid)) {
        for (const block of message.message.content) {
          if (block.type === "text") {
            this.accumulatedText += block.text;
          }
        }
      }
    }

    if (message.type === "result") {
      if (message.subtype !== "success") {
        const errors = "errors" in message ? message.errors : [];
        this.callbacks.onError(
          `Agent stopped (${message.subtype}): ${errors.join("; ") || "unknown error"}`,
        );
      }
      return true;
    }

    return false;
  }
}
