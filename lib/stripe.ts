import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-02-25.clover",
});

export const PRICE_IDS = {
  pro_monthly: "price_1Tlm577A2mOEJEeWRGeMx6YD",
  pro_annual: "price_1Tlm5T7A2mOEJEeWw4ggdmWU",
  business_monthly: "price_1TE3qf7A2mOEJEeWiTAz8oWd",
  business_annual: "price_1TE3qv7A2mOEJEeWEB04fuCE",
} as const;

export const PRICE_TO_PLAN: Record<string, string> = {
  [PRICE_IDS.pro_monthly]: "pro",
  [PRICE_IDS.pro_annual]: "pro",
  [PRICE_IDS.business_monthly]: "business",
  [PRICE_IDS.business_annual]: "business",
};
