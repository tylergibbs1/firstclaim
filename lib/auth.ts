import { supabase } from "./supabase";

/**
 * Validates the Authorization header and returns the authenticated user ID.
 * Returns null if the token is missing or invalid.
 */
export async function getUserId(req: Request): Promise<string | null> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const token = authHeader.slice(7);
  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) return null;
  return data.user.id;
}
