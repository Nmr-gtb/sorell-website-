import { createClient } from "@supabase/supabase-js";

/**
 * Supabase client with service_role key — bypasses RLS.
 * Only use in server-side API routes (never in client code).
 */
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
