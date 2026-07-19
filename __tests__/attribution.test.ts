import { describe, it, expect } from "vitest";
import { deriveSource, extractUtm } from "@/lib/attribution";

// ---------------------------------------------------------------------------
// Attribution d'acquisition : classification du premier contact.
// Répond à « SEO ou pas » pour chaque inscrit.
// ---------------------------------------------------------------------------

describe("deriveSource", () => {
  it("classe les moteurs de recherche en 'seo'", () => {
    expect(deriveSource("https://www.google.com/", {})).toBe("seo");
    expect(deriveSource("https://www.google.fr/search?q=veille", {})).toBe("seo");
    expect(deriveSource("https://www.bing.com/search", {})).toBe("seo");
    expect(deriveSource("https://duckduckgo.com/", {})).toBe("seo");
    expect(deriveSource("https://www.qwant.com/", {})).toBe("seo");
    expect(deriveSource("https://www.ecosia.org/", {})).toBe("seo");
  });

  it("classe les assistants IA en 'ia' (GEO)", () => {
    expect(deriveSource("https://chatgpt.com/", {})).toBe("ia");
    expect(deriveSource("https://chat.openai.com/", {})).toBe("ia");
    expect(deriveSource("https://www.perplexity.ai/search", {})).toBe("ia");
    expect(deriveSource("https://claude.ai/", {})).toBe("ia");
    expect(deriveSource("https://copilot.microsoft.com/", {})).toBe("ia");
    expect(deriveSource("https://gemini.google.com/", {})).toBe("ia");
  });

  it("gemini prime sur google (IA avant SEO)", () => {
    // gemini.google.com contient "google." : l'ordre de classification doit
    // ranger l'assistant IA en 'ia', pas en 'seo'.
    expect(deriveSource("https://gemini.google.com/app", {})).toBe("ia");
  });

  it("classe les réseaux sociaux en 'social'", () => {
    expect(deriveSource("https://www.linkedin.com/feed/", {})).toBe("social");
    expect(deriveSource("https://t.co/abc", {})).toBe("social");
    expect(deriveSource("https://www.reddit.com/r/Entrepreneur/", {})).toBe("social");
  });

  it("sans referrer : 'direct'", () => {
    expect(deriveSource("", {})).toBe("direct");
  });

  it("referrer invalide : 'direct'", () => {
    expect(deriveSource("pas-une-url", {})).toBe("direct");
  });

  it("navigation interne : 'interne'", () => {
    expect(deriveSource("https://www.sorell.fr/blog/veille-sectorielle-fintech-finance", {})).toBe("interne");
    expect(deriveSource("https://sorell.fr/tarifs", {})).toBe("interne");
  });

  it("autre domaine : renvoie le hostname (backlink identifiable)", () => {
    expect(deriveSource("https://www.appvizer.fr/marketing/newsletter", {})).toBe("www.appvizer.fr");
  });

  it("les UTM priment sur le referrer", () => {
    expect(deriveSource("https://www.google.com/", { utm_source: "newsletter", utm_medium: "email" })).toBe("newsletter/email");
    expect(deriveSource("", { utm_source: "emelia" })).toBe("emelia");
  });
});

describe("extractUtm", () => {
  it("extrait uniquement les paramètres utm_*", () => {
    const utm = extractUtm("?utm_source=linkedin&utm_medium=post&ref=abc&page=2");
    expect(utm).toEqual({ utm_source: "linkedin", utm_medium: "post" });
  });

  it("renvoie un objet vide sans paramètres", () => {
    expect(extractUtm("")).toEqual({});
    expect(extractUtm("?page=2")).toEqual({});
  });

  it("tronque les valeurs anormalement longues (200 max)", () => {
    const long = "x".repeat(500);
    const utm = extractUtm(`?utm_campaign=${long}`);
    expect(utm.utm_campaign).toHaveLength(200);
  });
});
