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

// ---------------------------------------------------------------------------
// Modèle IA par plan — plus le plan est élevé, meilleur (et plus coûteux) le modèle.
// Free → Haiku (rapide, économique) ; Pro → Sonnet ; Business & Enterprise → Opus.
// ---------------------------------------------------------------------------
export const DEFAULT_NEWSLETTER_MODEL = "claude-haiku-4-5-20251001";

export const MODEL_BY_PLAN: Record<PlanType, string> = {
  free: "claude-haiku-4-5-20251001",
  pro: "claude-sonnet-4-6",
  business: "claude-opus-4-8",
  enterprise: "claude-opus-4-8",
};

export function getModelForPlan(plan: string): string {
  if (plan === "solo") return MODEL_BY_PLAN.pro;
  return MODEL_BY_PLAN[(plan as PlanType)] || DEFAULT_NEWSLETTER_MODEL;
}

// ---------------------------------------------------------------------------
// Nombre d'articles par newsletter selon le plan.
// Les plans supérieurs ont des newsletters plus riches (jusqu'à 10 actus).
// ---------------------------------------------------------------------------
export const DEFAULT_ARTICLE_COUNT = 5;

export const ARTICLES_BY_PLAN: Record<PlanType, number> = {
  free: 5,
  pro: 5,
  business: 8,
  enterprise: 10,
};

export function getArticlesForPlan(plan: string): number {
  if (plan === "solo") return ARTICLES_BY_PLAN.pro;
  return ARTICLES_BY_PLAN[(plan as PlanType)] || DEFAULT_ARTICLE_COUNT;
}

// ---------------------------------------------------------------------------
// Mode Éditeur : le cron génère un brouillon qui attend la validation manuelle
// au lieu d'envoyer directement. Réservé aux plans Business et Enterprise.
// ---------------------------------------------------------------------------
export function canUseEditor(plan: string): boolean {
  return plan === "business" || plan === "enterprise";
}

// ---------------------------------------------------------------------------
// Longueur de newsletter personnalisable : les plans Business et Enterprise
// peuvent choisir librement le nombre d'articles (3 à 12). Les autres plans
// restent sur le défaut du plan (ARTICLES_BY_PLAN).
// ---------------------------------------------------------------------------
export const MIN_CUSTOM_ARTICLES = 3;
export const MAX_CUSTOM_ARTICLES = 12;

export function canCustomizeLength(plan: string): boolean {
  return plan === "business" || plan === "enterprise";
}

/**
 * Résout le nombre d'articles effectif pour une génération :
 * la valeur configurée si le plan y a droit et qu'elle est valide,
 * sinon le défaut du plan.
 */
export function resolveArticleCount(plan: string, configured?: number | null): number {
  if (
    canCustomizeLength(plan) &&
    typeof configured === "number" &&
    Number.isInteger(configured) &&
    configured >= MIN_CUSTOM_ARTICLES &&
    configured <= MAX_CUSTOM_ARTICLES
  ) {
    return configured;
  }
  return getArticlesForPlan(plan);
}
