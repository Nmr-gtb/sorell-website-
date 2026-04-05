import { NextResponse } from "next/server";
import { verifyAdminCredentials, generateAdminToken, TOKEN_EXPIRY_MS } from "@/lib/admin/auth";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { adminLoginRateLimit } from "@/lib/ratelimit";

export async function POST(request: Request) {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      || request.headers.get("x-real-ip")
      || "unknown";

    // Rate limiting via Upstash Redis (persistent across serverless instances)
    try {
      const { success } = await adminLoginRateLimit.limit(ip);
      if (!success) {
        return NextResponse.json(
          { error: "Trop de tentatives. Reessayez dans 15 minutes." },
          { status: 429 }
        );
      }
    } catch {
      // Fail-closed: if Redis is down, block login attempts
      return NextResponse.json(
        { error: "Service temporairement indisponible." },
        { status: 503 }
      );
    }

    const origin = request.headers.get("origin");
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://sorell.fr";
    if (origin && !origin.startsWith(siteUrl)) {
      return NextResponse.json({ error: "Requête non autorisée." }, { status: 403 });
    }

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Requete invalide." },
        { status: 400 }
      );
    }

    const { email, password } = body;

    if (!email || !password || typeof email !== "string" || typeof password !== "string") {
      return NextResponse.json(
        { error: "Email et mot de passe requis." },
        { status: 400 }
      );
    }

    // Validate email format
    if (email.length > 320 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "Identifiants invalides." },
        { status: 401 }
      );
    }

    // Validate password length (prevent DoS via extremely long passwords with bcrypt)
    if (password.length > 72) {
      return NextResponse.json(
        { error: "Identifiants invalides." },
        { status: 401 }
      );
    }

    const isValid = await verifyAdminCredentials(email, password);
    if (!isValid) {
      return NextResponse.json(
        { error: "Identifiants invalides." },
        { status: 401 }
      );
    }

    const token = generateAdminToken(email);

    // Log admin session (non-blocking)
    try {
      await supabaseAdmin.from("admin_sessions").insert({
        email,
        ip_address: ip,
        user_agent: (request.headers.get("user-agent") || "").slice(0, 500),
        expires_at: new Date(Date.now() + TOKEN_EXPIRY_MS).toISOString(),
      });
    } catch {
      // Non-blocking: session logging failure shouldn't prevent login
    }

    const response = NextResponse.json({ success: true });
    response.cookies.set("admin_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: TOKEN_EXPIRY_MS / 1000,
      path: "/",
    });

    return response;
  } catch {
    return NextResponse.json(
      { error: "Erreur interne." },
      { status: 500 }
    );
  }
}
