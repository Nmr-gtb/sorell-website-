// ---------------------------------------------------------------------------
// Attribution d'acquisition — premier contact (first touch).
//
// À la première visite, on mémorise dans localStorage d'où vient le visiteur
// (referrer, page d'atterrissage, paramètres UTM). À l'inscription, ces
// données partent dans les métadonnées du signup et le trigger handle_new_user
// les copie dans profiles.acquisition. Répond à « d'où viennent mes
// inscrits ? » (SEO, IA/GEO, direct, social...).
//
// 100 % first-party : aucun cookie tiers, aucune donnée envoyée à un service
// externe. Mentionné dans la politique de confidentialité.
// ---------------------------------------------------------------------------

const STORAGE_KEY = "sorell_acquisition";

export interface Acquisition {
  source: string;
  referrer: string;
  landing: string;
  utm: Record<string, string>;
  captured_at: string;
}

/** Domaines de moteurs de recherche → trafic SEO. */
const SEARCH_ENGINES = ["google.", "bing.com", "duckduckgo.com", "qwant.com", "ecosia.org", "yahoo.", "brave.com", "startpage.com"];

/** Assistants IA → trafic GEO (recommandation par un LLM). */
const AI_ASSISTANTS = ["chatgpt.com", "chat.openai.com", "perplexity.ai", "claude.ai", "copilot.microsoft.com", "gemini.google.com", "mistral.ai", "chat.deepseek.com"];

/** Réseaux sociaux. */
const SOCIAL_NETWORKS = ["linkedin.", "facebook.", "instagram.", "t.co", "twitter.com", "x.com", "reddit.com", "youtube.", "tiktok."];

/**
 * Déduit une source lisible du referrer + UTM. Priorité aux UTM (campagnes
 * taguées explicitement), sinon classification du domaine référent.
 */
export function deriveSource(referrer: string, utm: Record<string, string>): string {
  if (utm.utm_source) {
    return utm.utm_medium ? `${utm.utm_source}/${utm.utm_medium}` : utm.utm_source;
  }
  if (!referrer) return "direct";

  let host: string;
  try {
    host = new URL(referrer).hostname.toLowerCase();
  } catch {
    return "direct";
  }

  if (host.endsWith("sorell.fr")) return "interne";
  // IA avant SEO : gemini.google.com contient "google." et serait sinon
  // classé à tort en moteur de recherche.
  if (AI_ASSISTANTS.some((d) => host.includes(d))) return "ia";
  if (SEARCH_ENGINES.some((d) => host.includes(d))) return "seo";
  if (SOCIAL_NETWORKS.some((d) => host.includes(d))) return "social";
  return host;
}

/** Extrait les paramètres utm_* d'une URL. */
export function extractUtm(search: string): Record<string, string> {
  const utm: Record<string, string> = {};
  const params = new URLSearchParams(search);
  for (const [key, value] of params.entries()) {
    if (key.startsWith("utm_") && value) utm[key] = value.slice(0, 200);
  }
  return utm;
}

/**
 * Capture le premier contact si aucun n'est déjà mémorisé (first touch : la
 * première visite gagne, les suivantes ne l'écrasent pas). À appeler au
 * montage côté client.
 */
export function captureFirstTouch(): void {
  try {
    if (localStorage.getItem(STORAGE_KEY)) return;

    const referrer = document.referrer || "";
    // Une navigation interne ne constitue pas un premier contact utile ;
    // on capture quand même (landing + utm) car c'est bien la 1re visite.
    const utm = extractUtm(window.location.search);

    const acquisition: Acquisition = {
      source: deriveSource(referrer, utm),
      referrer: referrer.slice(0, 500),
      landing: (window.location.pathname + window.location.search).slice(0, 500),
      utm,
      captured_at: new Date().toISOString(),
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(acquisition));
  } catch {
    // localStorage indisponible (navigation privée stricte...) : tant pis,
    // l'inscription fonctionnera sans attribution.
  }
}

/** Relit l'attribution mémorisée (null si absente ou illisible). */
export function getStoredAttribution(): Acquisition | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Acquisition;
    if (!parsed || typeof parsed.source !== "string") return null;
    return parsed;
  } catch {
    return null;
  }
}
