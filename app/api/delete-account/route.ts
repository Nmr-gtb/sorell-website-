import { supabaseAdmin as supabase } from "@/lib/supabase-admin";
import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { stripe } from "@/lib/stripe";

export async function POST(request: Request) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return NextResponse.json({ error: "Non autorise" }, { status: 401 });
    }

    const { userId } = await request.json();

    if (!userId || userId !== authUser.id) {
      return NextResponse.json({ error: "Non autorise" }, { status: 403 });
    }

    // Récupérer le profil pour annuler Stripe si nécessaire
    const { data: profile } = await supabase
      .from("profiles")
      .select("stripe_subscription_id")
      .eq("id", userId)
      .maybeSingle();

    // Annuler l'abonnement Stripe en cours
    if (profile?.stripe_subscription_id) {
      try {
        await stripe.subscriptions.cancel(profile.stripe_subscription_id);
      } catch {
        // L'abonnement peut déjà être annulé
      }
    }

    // Supprimer dans l'ordre (à cause des foreign keys)
    const { data: newsletters } = await supabase
      .from("newsletters")
      .select("id")
      .eq("user_id", userId);

    const newsletterIds = newsletters?.map((n) => n.id) || [];

    if (newsletterIds.length > 0) {
      await supabase.from("newsletter_events").delete().in("newsletter_id", newsletterIds);
    }

    await supabase.from("newsletters").delete().eq("user_id", userId);
    await supabase.from("recipients").delete().eq("user_id", userId);
    await supabase.from("newsletter_config").delete().eq("user_id", userId);
    await supabase.from("lifecycle_emails").delete().eq("user_id", userId);
    await supabase.from("referrals").delete().eq("referrer_id", userId);
    await supabase.from("referrals").delete().eq("referee_id", userId);
    // Nettoyer referred_by des filleuls qui pointent vers ce parrain (évite les FK orphelines)
    await supabase.from("profiles").update({ referred_by: null }).eq("referred_by", userId);
    await supabase.from("profiles").delete().eq("id", userId);

    // Supprimer l'utilisateur de Supabase Auth
    try {
      await supabase.auth.admin.deleteUser(userId);
    } catch {
      // Fallback silencieux si l'utilisateur Auth est déjà supprimé
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Une erreur est survenue" }, { status: 500 });
  }
}
