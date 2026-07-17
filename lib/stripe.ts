import Stripe from "stripe";

// Price IDs et mapping plan : source de vérité partagée dans lib/price-ids.ts
// (sans SDK Stripe, donc réutilisable côté client).
export { PRICE_IDS, PRICE_TO_PLAN } from "@/lib/price-ids";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-02-25.clover",
});
