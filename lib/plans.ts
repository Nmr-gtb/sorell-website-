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

// ---------------------------------------------------------------------------
// Plafond serverless : sur Vercel gratuit, une fonction est coupée à 60s.
// Une génération Opus (Enterprise) de 10 articles + web search prend ~101s et
// dépasse donc la limite. On plafonne le nombre d'articles générés dans une
// fonction serverless (cron + /api/generate) pour tenir sous ~50s, par MODÈLE
// (mesuré : Opus lent, Sonnet/Haiku rapides). L'utilisateur complète ensuite
// jusqu'à la longueur voulue via l'éditeur (bouton "Ajouter un article", chaque
// ajout = 1 appel court). Le script hors-Vercel (scripts/trigger-editor-draft)
// n'est PAS soumis à ce plafond.
// ---------------------------------------------------------------------------
// Mesuré (Opus + web search) : 5 articles = 53s, 10 articles = 101s, soit
// ~9,7s/article + ~4s d'overhead. On plafonne Opus à 4 (~43s) pour garder ~17s
// de marge sous les 60s Vercel (recherches web parfois plus lentes + envoi
// éventuel des emails en mode auto).
const SERVERLESS_ARTICLE_CAP: Record<string, number> = {
  "claude-opus-4-8": 4,
  "claude-opus-4-7": 4,
  "claude-opus-4-6": 4,
  // Sonnet et Haiku génèrent assez vite pour ne pas nécessiter de plafond.
};

/** Nombre d'articles max qu'une génération serverless peut produire sous ~50s. */
export function serverlessArticleCap(model: string): number {
  return SERVERLESS_ARTICLE_CAP[model] ?? MAX_CUSTOM_ARTICLES;
}

/**
 * Durée estimée (ms) d'une génération serverless pour un modèle, plafond
 * d'articles inclus. Sert au budget temps du cron : ne démarrer une nouvelle
 * génération que si elle a le temps de finir avant les 60s Vercel.
 * Mesuré : Opus 4 articles ≈ 43s ; Sonnet et Haiku nettement plus rapides.
 */
export function estimatedGenerationMs(model: string): number {
  if (model.includes("opus")) return 45_000;
  if (model.includes("sonnet")) return 30_000;
  return 20_000; // Haiku et défaut
}

/**
 * Nombre d'articles effectif pour une génération SERVERLESS : la longueur
 * résolue, mais bornée par le plafond de temps du modèle (évite le timeout
 * Vercel 60s). Retourne aussi si un plafonnage a eu lieu (pour informer l'UI).
 */
export function resolveServerlessArticleCount(
  plan: string,
  configured: number | null | undefined,
  model: string
): { count: number; capped: boolean } {
  const wanted = resolveArticleCount(plan, configured);
  const cap = serverlessArticleCap(model);
  return { count: Math.min(wanted, cap), capped: wanted > cap };
}
