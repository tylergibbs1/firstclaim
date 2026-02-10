import { runAnalysis } from "@/lib/agent/run-analysis";
import { getUserId } from "@/lib/auth";

export const maxDuration = 120;

export async function POST(req: Request) {
  const userId = await getUserId(req);
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { clinicalNotes, patient } = await req.json();

  if (!clinicalNotes) {
    return Response.json({ error: "Missing clinicalNotes" }, { status: 400 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        await runAnalysis({
          clinicalNotes,
          patient,
          userId,
          onEvent(event) {
            const data = `data: ${JSON.stringify(event)}\n\n`;
            controller.enqueue(encoder.encode(data));
          },
        });
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "error", message: errMsg })}\n\n`));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
