import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-12-18.acacia",
});

export const PRICE_IDS = {
  pro_monthly: "price_1TE3pa7A2mOEJEeWltqInvgW",
  pro_annual: "price_1TE3ps7A2mOEJEeW4m1wm00z",
  business_monthly: "price_1TE3qf7A2mOEJEeWiTAz8oWd",
  business_annual: "price_1TE3qv7A2mOEJEeWEB04fuCE",
} as const;

export const PRICE_TO_PLAN: Record<string, string> = {
  [PRICE_IDS.pro_monthly]: "pro",
  [PRICE_IDS.pro_annual]: "pro",
  [PRICE_IDS.business_monthly]: "business",
  [PRICE_IDS.business_annual]: "business",
};
