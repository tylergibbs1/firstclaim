import { createSdkMcpServer } from "@anthropic-ai/claude-agent-sdk";
import { makeTools, type ClaimState } from "./tools";

export function makeMcpServer(state: ClaimState) {
  return createSdkMcpServer({
    name: "billing",
    version: "1.0.0",
    tools: makeTools(state),
  });
}
