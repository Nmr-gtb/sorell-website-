import { createClient } from "@supabase/supabase-js";

export async function getAuthenticatedUser(request: Request): Promise<{ id: string; email: string } | null> {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const token = authHeader.replace("Bearer ", "");
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return null;

  return { id: user.id, email: user.email || "" };
}

/**
 * Vérifie le CRON_SECRET pour les endpoints internes (cron, setup, push manuel).
 * Accepte le secret en query param (?secret=...) ou en header Bearer.
 */
export function verifyCronSecret(request: Request): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return false;
  const url = new URL(request.url);
  const querySecret = url.searchParams.get("secret");
  const authHeader = request.headers.get("authorization");
  const bearerSecret = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  return querySecret === cronSecret || bearerSecret === cronSecret;
}
