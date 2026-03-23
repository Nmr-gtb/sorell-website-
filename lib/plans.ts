export type PlanType = "free" | "pro" | "business" | "enterprise";

export const PLAN_LIMITS: Record<PlanType, {
  customBrief: boolean;
  customSources: boolean;
  maxRecipients: number;
  frequency: string[];
  generationsPerMonth: number;
  previewsPerMonth: number;
  analytics: "none" | "basic" | "full";
  customColor: boolean;
  customLogo: boolean;
}> = {
  free: {
    customBrief: true,
    customSources: false,
    maxRecipients: 1,
    frequency: ["bimonthly"],
    generationsPerMonth: 2,
    previewsPerMonth: 1,
    analytics: "none",
    customColor: false,
    customLogo: false,
  },
  pro: {
    customBrief: true,
    customSources: true,
    maxRecipients: 5,
    frequency: ["weekly"],
    generationsPerMonth: 4,
    previewsPerMonth: 4,
    analytics: "full",
    customColor: true,
    customLogo: false,
  },
  business: {
    customBrief: true,
    customSources: true,
    maxRecipients: 25,
    frequency: ["weekly", "biweekly", "daily"],
    generationsPerMonth: -1,
    previewsPerMonth: -1,
    analytics: "full",
    customColor: true,
    customLogo: true,
  },
  enterprise: {
    customBrief: true,
    customSources: true,
    maxRecipients: -1,
    frequency: ["weekly", "biweekly", "daily"],
    generationsPerMonth: -1,
    previewsPerMonth: -1,
    analytics: "full",
    customColor: true,
    customLogo: true,
  },
};

export function getPlanLimits(plan: string) {
  if (plan === "solo") return PLAN_LIMITS.pro;
  return PLAN_LIMITS[(plan as PlanType)] || PLAN_LIMITS.free;
}
