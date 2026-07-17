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
