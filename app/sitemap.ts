import { MetadataRoute } from "next";
import { BLOG_ARTICLES } from "@/lib/blog-articles";

export default function sitemap(): MetadataRoute.Sitemap {
  const blogEntries: MetadataRoute.Sitemap = BLOG_ARTICLES.map((article) => ({
    url: `https://sorell.fr/blog/${article.slug}`,
    lastModified: new Date(article.date),
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  return [
    { url: "https://sorell.fr", lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: "https://sorell.fr/comment-ca-marche", lastModified: new Date(), changeFrequency: "monthly", priority: 0.9 },
    { url: "https://sorell.fr/tarifs", lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: "https://sorell.fr/demo", lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: "https://sorell.fr/blog", lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    ...blogEntries,
    { url: "https://sorell.fr/contact", lastModified: new Date(), changeFrequency: "monthly", priority: 0.6 },
    { url: "https://sorell.fr/connexion", lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: "https://sorell.fr/legal", lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    { url: "https://sorell.fr/cgv", lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
    { url: "https://sorell.fr/confidentialite", lastModified: new Date(), changeFrequency: "yearly", priority: 0.3 },
  ];
}
