import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getAuthenticatedUser } from "@/lib/auth";
import crypto from "crypto";

// Générer un code de parrainage unique (8 caractères alphanumériques)
function generateCode(): string {
  return crypto.randomBytes(4).toString("hex").toUpperCase();
}

// GET — Récupérer le code de parrainage et les stats du user
export async function GET(request: Request) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    // Vérifier que le user est Pro ou Business
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("plan, referral_code")
      .eq("id", user.id)
      .maybeSingle();

    const eligiblePlans = ["pro", "business", "enterprise"];
    if (!profile || !eligiblePlans.includes(profile.plan)) {
      return NextResponse.json({
        error: "Le parrainage est réservé aux abonnés Pro et Business",
        eligible: false,
      }, { status: 403 });
    }

    // Générer un code si le user n'en a pas encore
    let code = profile.referral_code;
    if (!code) {
      code = generateCode();
      await supabaseAdmin
        .from("profiles")
        .update({ referral_code: code })
        .eq("id", user.id);
    }

    // Récupérer les stats de parrainage
    const { data: referrals } = await supabaseAdmin
      .from("referrals")
      .select("id, status, created_at, converted_at")
      .eq("referrer_id", user.id)
      .order("created_at", { ascending: false });

    const total = referrals?.length || 0;
    const converted = referrals?.filter((r) => r.status === "converted").length || 0;
    const pending = referrals?.filter((r) => r.status === "pending").length || 0;

    // Compter les parrainages convertis ce mois-ci (pour la limite de 3)
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const convertedThisMonth = referrals?.filter(
      (r) => r.status === "converted" && r.converted_at && new Date(r.converted_at) >= startOfMonth
    ).length || 0;

    return NextResponse.json({
      eligible: true,
      code,
      referralLink: `https://sorell.fr/?ref=${code}`,
      stats: {
        total,
        converted,
        pending,
        convertedThisMonth,
        remainingThisMonth: Math.max(0, 3 - convertedThisMonth),
      },
    });
  } catch {
    return NextResponse.json({ error: "Une erreur est survenue" }, { status: 500 });
  }
}

// POST — Enregistrer qu'un filleul s'est inscrit via un code de parrainage
export async function POST(request: Request) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { code, refereeId } = await request.json();

    if (!code || !refereeId) {
      return NextResponse.json({ error: "Données manquantes" }, { status: 400 });
    }

    // Vérifier que le refereeId correspond à l'utilisateur authentifié
    if (refereeId !== user.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    // Validation du format des inputs
    const codeRegex = /^[A-Z0-9]{8}$/i;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    if (typeof code !== "string" || !codeRegex.test(code)) {
      return NextResponse.json({ error: "Code invalide" }, { status: 400 });
    }

    if (typeof refereeId !== "string" || !uuidRegex.test(refereeId)) {
      return NextResponse.json({ error: "Données invalides" }, { status: 400 });
    }

    // Vérifier que le filleul existe
    const { data: referee } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("id", refereeId)
      .maybeSingle();

    if (!referee) {
      return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
    }

    // Trouver le parrain via le code
    const { data: referrer } = await supabaseAdmin
      .from("profiles")
      .select("id, plan")
      .eq("referral_code", code)
      .maybeSingle();

    if (!referrer) {
      return NextResponse.json({ error: "Code invalide" }, { status: 404 });
    }

    // Bloquer l'auto-parrainage
    if (referrer.id === refereeId) {
      return NextResponse.json({ error: "Auto-parrainage interdit" }, { status: 403 });
    }

    // Vérifier que le parrain est toujours Pro, Business ou Enterprise
    const eligiblePlans = ["pro", "business", "enterprise"];
    if (!eligiblePlans.includes(referrer.plan)) {
      return NextResponse.json({ error: "Parrain non éligible" }, { status: 403 });
    }

    // Vérifier la limite de 3 parrainages par mois
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { count } = await supabaseAdmin
      .from("referrals")
      .select("id", { count: "exact", head: true })
      .eq("referrer_id", referrer.id)
      .eq("status", "converted")
      .gte("converted_at", startOfMonth.toISOString());

    if (count !== null && count >= 3) {
      return NextResponse.json({ error: "Limite de parrainages atteinte ce mois" }, { status: 429 });
    }

    // Vérifier que le filleul n'est pas déjà parrainé
    const { data: existing } = await supabaseAdmin
      .from("referrals")
      .select("id")
      .eq("referee_id", refereeId)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ error: "Déjà parrainé" }, { status: 409 });
    }

    // Créer le referral en status pending
    const { error: insertError } = await supabaseAdmin.from("referrals").insert({
      referrer_id: referrer.id,
      referee_id: refereeId,
      code,
      status: "pending",
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    });

    if (insertError) {
      return NextResponse.json({ error: "Erreur lors de l'enregistrement" }, { status: 500 });
    }

    // Marquer le filleul
    await supabaseAdmin
      .from("profiles")
      .update({ referred_by: referrer.id })
      .eq("id", refereeId);

    return NextResponse.json({ success: true, referrerId: referrer.id });
  } catch {
    return NextResponse.json({ error: "Une erreur est survenue" }, { status: 500 });
  }
}
