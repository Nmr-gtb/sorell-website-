export type PlanType = "free" | "pro" | "enterprise";

export const PLAN_LIMITS: Record<PlanType, {
  customBrief: boolean;
  maxRecipients: number;
  frequency: string[];
  generationsPerMonth: number;
  analytics: "none" | "basic" | "full";
}> = {
  free: {
    customBrief: true,
    maxRecipients: 1,
    frequency: ["weekly", "monthly"],
    generationsPerMonth: 4,
    analytics: "basic",
  },
  pro: {
    customBrief: true,
    maxRecipients: 10,
    frequency: ["weekly", "monthly"],
    generationsPerMonth: -1,
    analytics: "full",
  },
  enterprise: {
    customBrief: true,
    maxRecipients: -1,
    frequency: ["weekly", "monthly"],
    generationsPerMonth: -1,
    analytics: "full",
  },
};

export function getPlanLimits(plan: string) {
  if (plan === "solo") return PLAN_LIMITS.pro; // backward compat
  return PLAN_LIMITS[(plan as PlanType)] || PLAN_LIMITS.free;
}
