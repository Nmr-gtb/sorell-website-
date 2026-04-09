import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { notifyNewSignup } from '@/lib/eva-notifications'
import { logSignup } from '@/lib/activity-log'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const refCode = requestUrl.searchParams.get('ref')

  if (code) {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    const { data: { session } } = await supabase.auth.exchangeCodeForSession(code)

    if (session) {
      // Vérifier si c'est une première inscription (pas juste un login)
      const { data: profile } = await supabase
        .from("profiles")
        .select("created_at")
        .eq("id", session.user.id)
        .single();

      if (profile) {
        const createdAt = new Date(profile.created_at);
        const now = new Date();
        const isNewUser = (now.getTime() - createdAt.getTime()) < 60000; // moins d'1 minute

        if (isNewUser) {
          await fetch(new URL("/api/welcome-email", request.url).toString(), {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({
              email: session.user.email,
              name: session.user.user_metadata?.full_name || "",
            }),
          }).catch(() => {});

          // Notifier Noé sur Telegram via Eva
          await notifyNewSignup(
            session.user.user_metadata?.full_name || "",
            session.user.email || ""
          );

          // Activity log
          void logSignup(session.user.id, session.user.email || "", session.user.user_metadata?.full_name || "");

          // Enregistrer le parrainage si un code ref est présent
          if (refCode) {
            await fetch(new URL("/api/referral", request.url).toString(), {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${session.access_token}`,
              },
              body: JSON.stringify({
                code: refCode,
                refereeId: session.user.id,
              }),
            }).catch(() => {});
          }
        }
      }
    }
  }

  // Rediriger vers le dashboard avec le ref code pour que le client-side puisse aussi le traiter
  const redirectUrl = new URL('/dashboard', request.url);
  return NextResponse.redirect(redirectUrl)
}
