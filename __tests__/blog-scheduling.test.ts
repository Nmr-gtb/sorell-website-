import { describe, it, expect } from "vitest";
import {
  BLOG_ARTICLES,
  getPublishedArticles,
  getPublishedArticle,
  getRelatedArticles,
  todayISO,
} from "@/lib/blog-articles";

/**
 * Publication programmée du blog.
 *
 * Le calendrier éditorial est committé en une fois : les articles à venir
 * portent une date future et ne doivent apparaître nulle part avant elle.
 * Une régression ici publierait d'un coup tous les articles programmés.
 */
describe("todayISO", () => {
  it("retourne une date au format YYYY-MM-DD", () => {
    expect(todayISO(new Date("2026-09-26T10:00:00Z"))).toBe("2026-09-26");
  });

  it("utilise le fuseau de Paris, pas UTC", () => {
    // 22h30 UTC le 25 = 00h30 le 26 à Paris (UTC+2 en heure d'été).
    expect(todayISO(new Date("2026-09-25T22:30:00Z"))).toBe("2026-09-26");
  });
});

describe("getPublishedArticles", () => {
  it("exclut les articles dont la date est dans le futur", () => {
    const published = getPublishedArticles(new Date("2026-01-01T12:00:00Z"));
    const futureOnes = published.filter((a) => a.date > "2026-01-01");
    expect(futureOnes).toEqual([]);
  });

  it("inclut un article daté du jour même", () => {
    const anyArticle = BLOG_ARTICLES[0];
    const published = getPublishedArticles(
      new Date(`${anyArticle.date}T12:00:00Z`)
    );
    expect(published.map((a) => a.slug)).toContain(anyArticle.slug);
  });

  it("retourne les articles du plus récent au plus ancien", () => {
    const dates = getPublishedArticles(new Date("2030-01-01T12:00:00Z")).map(
      (a) => a.date
    );
    const sorted = [...dates].sort((a, b) => b.localeCompare(a));
    expect(dates).toEqual(sorted);
  });

  it("ne publie rien avant la date du tout premier article", () => {
    const earliest = BLOG_ARTICLES.reduce(
      (min, a) => (a.date < min ? a.date : min),
      BLOG_ARTICLES[0].date
    );
    const dayBefore = new Date(new Date(earliest).getTime() - 86_400_000);
    expect(getPublishedArticles(dayBefore)).toEqual([]);
  });
});

describe("getPublishedArticle", () => {
  it("retourne undefined pour un article pas encore publié", () => {
    const article = BLOG_ARTICLES[0];
    const dayBefore = new Date(new Date(article.date).getTime() - 86_400_000);
    expect(getPublishedArticle(article.slug, dayBefore)).toBeUndefined();
  });

  it("retourne l'article une fois sa date atteinte", () => {
    const article = BLOG_ARTICLES[0];
    expect(
      getPublishedArticle(article.slug, new Date(`${article.date}T12:00:00Z`))
    ).toMatchObject({ slug: article.slug });
  });

  it("retourne undefined pour un slug inexistant", () => {
    expect(getPublishedArticle("slug-qui-n-existe-pas")).toBeUndefined();
  });
});

describe("getRelatedArticles", () => {
  const late = new Date("2030-01-01T12:00:00Z");

  it("n'inclut jamais l'article lui-même", () => {
    for (const article of BLOG_ARTICLES) {
      const related = getRelatedArticles(article, 3, late);
      expect(related.map((a) => a.slug)).not.toContain(article.slug);
    }
  });

  it("n'inclut aucun article non publié", () => {
    const article = getPublishedArticles(new Date("2026-04-21T12:00:00Z"))[0];
    const related = getRelatedArticles(article, 3, new Date("2026-04-21T12:00:00Z"));
    for (const item of related) {
      expect(item.date <= "2026-04-21").toBe(true);
    }
  });

  it("respecte la limite demandée", () => {
    expect(getRelatedArticles(BLOG_ARTICLES[0], 2, late)).toHaveLength(2);
  });

  it("privilégie les articles partageant le plus de tags", () => {
    const article = BLOG_ARTICLES[0];
    const related = getRelatedArticles(article, 3, late);
    const sharedCounts = related.map(
      (a) => a.tags.filter((t) => article.tags.includes(t)).length
    );
    // La liste doit être décroissante en nombre de tags communs.
    expect(sharedCounts).toEqual([...sharedCounts].sort((a, b) => b - a));
  });
});

describe("intégrité des données du blog", () => {
  it("n'a aucun slug en double", () => {
    const slugs = BLOG_ARTICLES.map((a) => a.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("a des dates au format YYYY-MM-DD valides", () => {
    for (const article of BLOG_ARTICLES) {
      expect(article.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(Number.isNaN(new Date(article.date).getTime())).toBe(false);
    }
  });

  it("a des slugs en minuscules sans espace ni accent", () => {
    for (const article of BLOG_ARTICLES) {
      expect(article.slug).toMatch(/^[a-z0-9-]+$/);
    }
  });

  it("a un titre, une description et du contenu pour chaque article", () => {
    for (const article of BLOG_ARTICLES) {
      expect(article.title.trim().length).toBeGreaterThan(0);
      expect(article.description.trim().length).toBeGreaterThan(0);
      expect(article.content.trim().length).toBeGreaterThan(0);
      expect(article.tags.length).toBeGreaterThan(0);
    }
  });

  it("ne mentionne jamais l'ancien prix de 19 euros pour le plan Pro", () => {
    // Le Pro est à 9,99 euros par mois. L'ancien tarif traînant dans un
    // article publierait une information fausse sur le site.
    for (const article of BLOG_ARTICLES) {
      const haystack = `${article.title} ${article.description} ${article.content}`;
      expect(haystack).not.toMatch(/19\s?(€|euros?)\s?\/?\s?(mois|month)/i);
    }
  });
});

describe("liens internes entre articles", () => {
  const BY_SLUG = new Map(BLOG_ARTICLES.map((a) => [a.slug, a]));

  function internalLinks(article: (typeof BLOG_ARTICLES)[number]): string[] {
    return [...article.content.matchAll(/href="\/blog\/([^"#?]+)"/g)].map(
      (m) => m[1]
    );
  }

  it("ne pointe vers aucun article inexistant", () => {
    const broken: string[] = [];
    for (const article of BLOG_ARTICLES) {
      for (const target of internalLinks(article)) {
        if (!BY_SLUG.has(target)) {
          broken.push(`${article.slug} -> ${target}`);
        }
      }
    }
    expect(broken).toEqual([]);
  });

  /**
   * Le calendrier éditorial est committé d'avance : un article programmé ne
   * doit jamais pointer vers un article publié après lui, sinon le lien renvoie
   * un 404 pendant tout l'intervalle entre les deux dates.
   *
   * La règle ne porte que sur les articles encore à venir. Les articles déjà
   * publiés se lient parfois entre eux à contre-temps (héritage d'avant la
   * publication programmée), mais leurs cibles sont toutes en ligne : plus
   * aucun de ces liens ne peut casser.
   */
  it("aucun article programmé ne pointe vers un article publié plus tard", () => {
    const today = todayISO();
    const premature: string[] = [];
    for (const article of BLOG_ARTICLES) {
      if (article.date <= today) continue; // déjà publié : cibles toutes en ligne
      for (const target of internalLinks(article)) {
        const dest = BY_SLUG.get(target);
        if (dest && dest.date > article.date) {
          premature.push(
            `${article.slug} (${article.date}) -> ${target} (${dest.date})`
          );
        }
      }
    }
    expect(premature).toEqual([]);
  });

  it("ne contient aucun lien d'un article vers lui-même", () => {
    const selfLinks = BLOG_ARTICLES.filter((a) =>
      internalLinks(a).includes(a.slug)
    ).map((a) => a.slug);
    expect(selfLinks).toEqual([]);
  });
});
