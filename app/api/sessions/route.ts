import { getUserId } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export async function GET(req: Request) {
  const userId = await getUserId(req);
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: sessions, error } = await supabase
    .from("sessions")
    .select("id, created_at, clinical_notes, claim, status")
    .eq("user_id", userId)
    .eq("status", "completed")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  // Get message counts for all sessions
  const sessionIds = sessions.map((s: { id: string }) => s.id);
  const { data: counts } = await supabase
    .from("messages")
    .select("session_id")
    .in("session_id", sessionIds);

  const countMap: Record<string, number> = {};
  for (const row of counts ?? []) {
    countMap[row.session_id] = (countMap[row.session_id] ?? 0) + 1;
  }

  const result = sessions.map((s: { id: string; created_at: string; clinical_notes: string | null; claim: { riskScore?: number } | null }) => ({
    id: s.id,
    createdAt: s.created_at,
    clinicalNotesPreview: (s.clinical_notes ?? "").slice(0, 60),
    riskScore: s.claim?.riskScore ?? null,
    messageCount: countMap[s.id] ?? 0,
  }));

  return Response.json({ sessions: result });
}
