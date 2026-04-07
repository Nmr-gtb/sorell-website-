export type PlanType = "free" | "pro" | "business" | "enterprise";

export const PLAN_LIMITS: Record<PlanType, {
  customBrief: boolean;
  customSources: boolean;
  customTopics: boolean;
  maxRecipients: number;
  frequency: string[];
  generationsPerMonth: number;
  previewsPerMonth: number;
  analytics: "none" | "basic" | "full";
  historique: boolean;
  customColor: boolean;
  customLogo: boolean;
}> = {
  free: {
    customBrief: true,
    customSources: false,
    customTopics: false,
    maxRecipients: 1,
    frequency: ["monthly"],
    generationsPerMonth: 1,
    previewsPerMonth: 0,
    analytics: "none",
    historique: false,
    customColor: false,
    customLogo: false,
  },
  pro: {
    customBrief: true,
    customSources: true,
    customTopics: true,
    maxRecipients: 10,
    frequency: ["weekly", "biweekly", "monthly"],
    generationsPerMonth: -1,
    previewsPerMonth: -1,
    analytics: "full",
    historique: true,
    customColor: true,
    customLogo: false,
  },
  business: {
    customBrief: true,
    customSources: true,
    customTopics: true,
    maxRecipients: 50,
    frequency: ["daily", "weekly", "biweekly", "monthly"],
    generationsPerMonth: -1,
    previewsPerMonth: -1,
    analytics: "full",
    historique: true,
    customColor: true,
    customLogo: true,
  },
  enterprise: {
    customBrief: true,
    customSources: true,
    customTopics: true,
    maxRecipients: -1,
    frequency: ["daily", "weekly", "biweekly", "monthly"],
    generationsPerMonth: -1,
    previewsPerMonth: -1,
    analytics: "full",
    historique: true,
    customColor: true,
    customLogo: true,
  },
};

export function getPlanLimits(plan: string) {
  if (plan === "solo") return PLAN_LIMITS.pro;
  return PLAN_LIMITS[(plan as PlanType)] || PLAN_LIMITS.free;
}
