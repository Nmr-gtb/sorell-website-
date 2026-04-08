import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { promoRateLimit } from "@/lib/ratelimit";

interface PromoCode {
  id: string;
  code: string;
  type: "free_months" | "percentage" | "fixed";
  value: number;
  applicable_plans: string[];
  max_uses: number | null;
  current_uses: number;
  expires_at: string | null;
  active: boolean;
}

export async function POST(request: Request) {
  try {
    const { code } = await request.json();

    if (!code || typeof code !== "string" || code.length > 50) {
      return NextResponse.json({ valid: false, error: "Code invalide" }, { status: 400 });
    }

    // Rate limiting par IP (anti-bruteforce)
    const ip = request.headers.get("x-real-ip") || request.headers.get("x-forwarded-for") || "unknown";
    try {
      const { success: rateLimitOk } = await promoRateLimit.limit(ip);
      if (!rateLimitOk) {
        return NextResponse.json({ valid: false, error: "Trop de tentatives" }, { status: 429 });
      }
    } catch {
      // Redis unavailable — fail-close for security
      return NextResponse.json({ valid: false, error: "Service temporairement indisponible" }, { status: 503 });
    }

    const { data, error } = await supabaseAdmin
      .from("promo_codes")
      .select("id, code, type, value, applicable_plans, max_uses, current_uses, expires_at, active")
      .eq("code", code.trim())
      .eq("active", true)
      .maybeSingle();

    if (error || !data) {
      return NextResponse.json({ valid: false, error: "Code invalide ou expiré" });
    }

    const promo = data as PromoCode;

    // Vérifier expiration
    if (promo.expires_at && new Date(promo.expires_at) < new Date()) {
      return NextResponse.json({ valid: false, error: "Code expiré" });
    }

    // Vérifier limite d'utilisation
    if (promo.max_uses !== null && promo.current_uses >= promo.max_uses) {
      return NextResponse.json({ valid: false, error: "Code déjà utilisé le nombre maximum de fois" });
    }

    // Construire la description
    let description = "";
    if (promo.type === "free_months") {
      description = promo.value === 1
        ? "1 mois offert"
        : `${promo.value} mois offerts`;
    } else if (promo.type === "percentage") {
      description = `-${promo.value}%`;
    } else if (promo.type === "fixed") {
      description = `-${(promo.value / 100).toFixed(0)}€`;
    }

    return NextResponse.json({
      valid: true,
      promoId: promo.id,
      type: promo.type,
      value: promo.value,
      description,
      applicablePlans: promo.applicable_plans,
    });
  } catch {
    return NextResponse.json({ error: "Une erreur est survenue" }, { status: 500 });
  }
}
