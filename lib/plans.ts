export type PlanType = "free" | "solo" | "pro" | "enterprise";

export const PLAN_LIMITS: Record<PlanType, {
  customBrief: boolean;
  maxRecipients: number; // -1 = illimité
  frequency: string[]; // options disponibles
  generationsPerMonth: number; // -1 = illimité
  analytics: "none" | "basic" | "full";
}> = {
  free: {
    customBrief: false,
    maxRecipients: 1,
    frequency: ["monthly"],
    generationsPerMonth: 1,
    analytics: "none",
  },
  solo: {
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
  return PLAN_LIMITS[(plan as PlanType)] || PLAN_LIMITS.free;
}
