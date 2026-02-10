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

  const { data: session, error } = await supabase
    .from("sessions")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .single();

  if (error || !session) {
    return Response.json({ error: "Session not found" }, { status: 404 });
  }

  const { data: messages, error: msgError } = await supabase
    .from("messages")
    .select("*")
    .eq("session_id", id)
    .order("created_at", { ascending: true });

  if (msgError) {
    return Response.json({ error: msgError.message }, { status: 500 });
  }

  return Response.json({ session, messages });
}
