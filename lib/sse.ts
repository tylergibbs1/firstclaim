/**
 * Consumes a Server-Sent Events stream, parsing each `data: {...}` frame
 * and invoking `onEvent` with the parsed JSON payload.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function consumeSSE(
  body: ReadableStream<Uint8Array>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onEvent: (event: any) => void
): Promise<void> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      try {
        onEvent(JSON.parse(line.slice(6)));
      } catch {
        // skip malformed JSON
      }
    }
  }
}
