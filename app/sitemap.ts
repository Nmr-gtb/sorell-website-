import { MetadataRoute } from "next";
import { BLOG_ARTICLES } from "@/lib/blog-articles";
import { SITE_URL } from "@/lib/site";

/**
 * Dernière modification réelle de chaque page statique.
 *
 * Ne JAMAIS remettre `new Date()` ici : la date changeait à chaque déploiement,
 * donc toutes les pages annonçaient « modifiée à l'instant » en permanence.
 * Google finit par considérer le lastmod comme non fiable et l'ignore, ce qui
 * dégrade la planification du crawl. À mettre à jour quand le contenu change.
 */
const LAST_MODIFIED: Record<string, string> = {
  "": "2026-07-23",
  "/comment-ca-marche": "2026-07-23",
  "/tarifs": "2026-07-23",
  "/demo": "2026-04-03",
  "/contact": "2026-04-07",
  "/legal": "2026-04-07",
  "/cgv": "2026-04-07",
  "/confidentialite": "2026-07-19",
};

export default function sitemap(): MetadataRoute.Sitemap {
  const blogEntries: MetadataRoute.Sitemap = BLOG_ARTICLES.map((article) => ({
    url: `${SITE_URL}/blog/${article.slug}`,
    lastModified: new Date(article.date),
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  // L'index du blog date du dernier article publié : la valeur se met à jour
  // toute seule à chaque nouvel article.
  const lastArticleDate = BLOG_ARTICLES.reduce((latest, article) => {
    const date = new Date(article.date);
    return date > latest ? date : latest;
  }, new Date(0));

  const page = (
    path: keyof typeof LAST_MODIFIED,
    changeFrequency: "weekly" | "monthly" | "yearly",
    priority: number
  ) => ({
    url: `${SITE_URL}${path}`,
    lastModified: new Date(LAST_MODIFIED[path]),
    changeFrequency,
    priority,
  });

  return [
    page("", "weekly", 1),
    page("/comment-ca-marche", "monthly", 0.9),
    page("/tarifs", "monthly", 0.8),
    page("/demo", "monthly", 0.8),
    { url: `${SITE_URL}/blog`, lastModified: lastArticleDate, changeFrequency: "weekly", priority: 0.8 },
    ...blogEntries,
    page("/contact", "monthly", 0.6),
    // /connexion retiré : la page est en noindex, la lister ici envoyait un
    // signal contradictoire à Google ("envoyée mais non indexée").
    page("/legal", "yearly", 0.3),
    page("/cgv", "yearly", 0.3),
    page("/confidentialite", "yearly", 0.3),
  ];
}
