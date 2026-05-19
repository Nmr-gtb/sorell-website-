import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { verifyEmailToken } from "@/lib/verify-email-token";
import { logEmailVerified } from "@/lib/activity-log";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");
    const token = searchParams.get("token");

    if (!email || !token) {
      return NextResponse.redirect("https://www.sorell.fr/dashboard?email_verified=error");
    }

    if (!verifyEmailToken(email, token)) {
      return NextResponse.redirect("https://www.sorell.fr/dashboard?email_verified=error");
    }

    // Marquer l'email comme verifie dans profiles + tracer la date pour
    // les declencheurs lifecycle (activation_no_config a J+2 apres verif).
    const { error } = await supabaseAdmin
      .from("profiles")
      .update({
        email_verified: true,
        email_verified_at: new Date().toISOString(),
      })
      .eq("email", email.toLowerCase().trim());

    if (error) {
      return NextResponse.redirect("https://www.sorell.fr/dashboard?email_verified=error");
    }

    // Activity log - userId not readily available, use empty string
    void logEmailVerified("", email);

    return NextResponse.redirect("https://www.sorell.fr/dashboard?email_verified=success");
  } catch {
    return NextResponse.redirect("https://www.sorell.fr/dashboard?email_verified=error");
  }
}
