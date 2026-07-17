import { BLOG_ARTICLES } from "@/lib/blog-articles";
import BlogArticleClient from "./BlogArticleClient";

// Les métadonnées (title, description, openGraph avec og:image, canonical) sont
// définies dans layout.tsx pour cette route. On NE redéfinit PAS generateMetadata
// ici : un second generateMetadata sur la même route écrasait champ par champ
// celui du layout, supprimant l'og:image et doublant le suffixe "| Sorell".

export function generateStaticParams() {
  return BLOG_ARTICLES.map((article) => ({
    slug: article.slug,
  }));
}

export default function BlogArticlePage() {
  return <BlogArticleClient />;
}
