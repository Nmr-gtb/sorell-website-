import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-12-18.acacia",
});

export const PRICE_IDS = {
  pro_monthly: "price_1TCQa37A2mOEJEeWkjjKWDQL",
  pro_annual: "price_1TCQaK7A2mOEJEeW7XCq4bnX",
} as const;

export const PRICE_TO_PLAN: Record<string, string> = {
  [PRICE_IDS.pro_monthly]: "pro",
  [PRICE_IDS.pro_annual]: "pro",
};
