import { notFound } from "next/navigation";
import {
  getPublishedArticle,
  getPublishedArticles,
  getRelatedArticles,
} from "@/lib/blog-articles";
import BlogArticleClient from "./BlogArticleClient";

// Les métadonnées (title, description, openGraph avec og:image, canonical) sont
// définies dans layout.tsx pour cette route. On NE redéfinit PAS generateMetadata
// ici : un second generateMetadata sur la même route écrasait champ par champ
// celui du layout, supprimant l'og:image et doublant le suffixe "| Sorell".

/**
 * Régénération horaire : un article programmé devient accessible le jour dit
 * sans qu'il y ait besoin de redéployer le site.
 */
export const revalidate = 3600;

export function generateStaticParams() {
  // Seuls les articles déjà publiés sont pré-générés. Les articles programmés
  // sont rendus à la demande une fois leur date atteinte (dynamicParams est
  // actif par défaut), et renvoient un 404 d'ici là.
  return getPublishedArticles().map((article) => ({
    slug: article.slug,
  }));
}

export default async function BlogArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = getPublishedArticle(slug);

  // Un article dont la date n'est pas encore atteinte renvoie un vrai 404 :
  // sans ça, l'URL serait devinable et Google pourrait indexer l'article
  // avant sa date de publication.
  if (!article) {
    notFound();
  }

  return (
    <BlogArticleClient
      article={article}
      related={getRelatedArticles(article)}
    />
  );
}
