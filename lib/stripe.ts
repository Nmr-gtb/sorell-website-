import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-12-18.acacia",
});

export const PRICE_IDS = {
  pro_monthly: "price_1TCdgv7A2mOEJEeWEEsDD5pM",
  pro_annual: "price_1TCdh67A2mOEJEeWsknZ5cx6",
} as const;

export const PRICE_TO_PLAN: Record<string, string> = {
  [PRICE_IDS.pro_monthly]: "pro",
  [PRICE_IDS.pro_annual]: "pro",
};
