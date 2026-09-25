import { getPublishedArticles } from "@/lib/blog-articles";
import BlogListClient from "./BlogListClient";

/**
 * Server Component : c'est ici que le calendrier éditorial est appliqué.
 *
 * `getPublishedArticles()` écarte les articles dont la date est dans le futur.
 * La page se régénère toutes les heures (ISR), donc l'article du jour apparaît
 * tout seul, sans redéploiement. Le filtre doit rester côté serveur : dans un
 * Client Component, le HTML pré-rendu servi aux robots figerait la liste à la
 * date du build.
 */
export const revalidate = 3600;

export default function BlogPage() {
  return <BlogListClient articles={getPublishedArticles()} />;
}
