import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-12-18.acacia",
});

export const PRICE_IDS = {
  solo_monthly: "price_1TCKcS54nBPaQCDaZes7bFfg",
  solo_annual: "price_1TCKcS54nBPaQCDaCOxOdHnt",
  pro_monthly: "price_1TCKdF54nBPaQCDaQDe6HzH5",
  pro_annual: "price_1TCKdZ54nBPaQCDa7jPxphnY",
} as const;

export const PRICE_TO_PLAN: Record<string, string> = {
  [PRICE_IDS.solo_monthly]: "solo",
  [PRICE_IDS.solo_annual]: "solo",
  [PRICE_IDS.pro_monthly]: "pro",
  [PRICE_IDS.pro_annual]: "pro",
};
