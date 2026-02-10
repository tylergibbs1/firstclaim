import { getUserId } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getUserId(req);
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const [sessionResult, messagesResult] = await Promise.all([
    supabase
      .from("sessions")
      .select("*")
      .eq("id", id)
      .eq("user_id", userId)
      .single(),
    supabase
      .from("messages")
      .select("*")
      .eq("session_id", id)
      .order("created_at", { ascending: true }),
  ]);

  if (sessionResult.error || !sessionResult.data) {
    return Response.json({ error: "Session not found" }, { status: 404 });
  }

  if (messagesResult.error) {
    return Response.json({ error: messagesResult.error.message }, { status: 500 });
  }

  return Response.json({ session: sessionResult.data, messages: messagesResult.data });
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getUserId(req);
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const { data, error } = await supabase
    .from("sessions")
    .delete()
    .eq("id", id)
    .eq("user_id", userId)
    .select("id")
    .single();

  if (error || !data) {
    return Response.json({ error: "Session not found" }, { status: 404 });
  }

  return Response.json({ success: true });
}
