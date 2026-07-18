// ---------------------------------------------------------------------------
// Source de vérité UNIQUE des price IDs Stripe (production).
// Ce fichier ne contient QUE des constantes — aucun import du SDK Stripe —
// pour pouvoir être importé aussi bien côté serveur (lib/stripe.ts, API routes)
// que côté client (pages "use client" : dashboard, tarifs).
// Objectif : plus jamais de désynchronisation entre le prix affiché et la
// whitelist serveur.
//
// Vérifié en live sur Stripe (juillet 2026) :
//   Pro mensuel  9,99€  -> price_1Tlm577A2mOEJEeWRGeMx6YD (actif)
//   Pro annuel   99€    -> price_1Tlm5T7A2mOEJEeWw4ggdmWU (actif)
//   Business m.  49€    -> price_1TE3qf7A2mOEJEeWiTAz8oWd (actif)
//   Business an. 490€   -> price_1TE3qv7A2mOEJEeWEB04fuCE (actif)
// ---------------------------------------------------------------------------

export const PRICE_IDS = {
  pro_monthly: "price_1Tlm577A2mOEJEeWRGeMx6YD",
  pro_annual: "price_1Tlm5T7A2mOEJEeWw4ggdmWU",
  business_monthly: "price_1TE3qf7A2mOEJEeWiTAz8oWd",
  business_annual: "price_1TE3qv7A2mOEJEeWEB04fuCE",
} as const;

// Anciens price IDs Pro (montant 19€), archivés dans Stripe. Aucun abonné actif
// ne les utilise aujourd'hui, mais on les mappe malgré tout vers "pro" pour
// qu'un éventuel abonné historique ne soit jamais downgradé en "free" par le
// webhook customer.subscription.updated (fallback défensif, coût nul).
export const LEGACY_PRICE_TO_PLAN: Record<string, string> = {
  price_1TE3pa7A2mOEJEeWltqInvgW: "pro", // ancien Pro mensuel 19€ (archivé)
  price_1TE3ps7A2mOEJEeW4m1wm00z: "pro", // ancien Pro annuel (supprimé)
};

export const PRICE_TO_PLAN: Record<string, string> = {
  [PRICE_IDS.pro_monthly]: "pro",
  [PRICE_IDS.pro_annual]: "pro",
  [PRICE_IDS.business_monthly]: "business",
  [PRICE_IDS.business_annual]: "business",
  ...LEGACY_PRICE_TO_PLAN,
};

// ---------------------------------------------------------------------------
// Plan effectif selon le STATUT de l'abonnement Stripe (pas seulement le prix).
// Politique de grâce : premium conservé pendant la fenêtre de relance Stripe
// (past_due), coupé dès que Stripe passe l'abonnement dans un état terminal ou
// suspendu (unpaid, canceled, paused, incomplete_expired, incomplete). Sans ce
// gating, un abonnement marqué "unpaid" (config Stripe sans annulation auto)
// gardait le plan premium en base indéfiniment.
// ---------------------------------------------------------------------------
const GRACE_STATUSES = new Set(["active", "trialing", "past_due"]);

export function planForSubscriptionStatus(status: string, priceId: string | undefined): string {
  const paidPlan = (priceId && PRICE_TO_PLAN[priceId]) || "free";
  return GRACE_STATUSES.has(status) ? paidPlan : "free";
}
