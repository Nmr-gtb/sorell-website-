import { supabaseAdmin as supabase } from "@/lib/supabase-admin";
import { NextResponse } from "next/server";
import { verifyUnsubscribeToken } from "@/lib/unsubscribe-token";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email");
  const token = searchParams.get("token");
  const userId = searchParams.get("uid");

  if (!email) {
    return NextResponse.redirect(new URL("/desabonnement?status=error", request.url));
  }

  // Vérifier le token HMAC (empêche le désabonnement non autorisé)
  if (!token || !verifyUnsubscribeToken(email, token)) {
    return NextResponse.redirect(new URL("/desabonnement?status=error", request.url));
  }

  try {
    if (userId) {
      await supabase.from("recipients").delete().eq("email", email).eq("user_id", userId);
    } else {
      await supabase.from("recipients").delete().eq("email", email);
    }

    return NextResponse.redirect(
      new URL("/desabonnement?status=success&email=" + encodeURIComponent(email), request.url)
    );
  } catch {
    return NextResponse.redirect(new URL("/desabonnement?status=error", request.url));
  }
}
