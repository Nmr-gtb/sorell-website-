import type { Metadata } from "next";
import { BLOG_ARTICLES } from "@/lib/blog-articles";
import BlogArticleClient from "./BlogArticleClient";

interface BlogPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: BlogPageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = BLOG_ARTICLES.find((a) => a.slug === slug);

  if (!article) {
    return {
      title: "Article introuvable - Sorell",
      description: "Cet article n'existe pas ou a ete deplace.",
    };
  }

  return {
    title: `${article.title} - Blog Sorell`,
    description: article.description,
    openGraph: {
      title: article.title,
      description: article.description,
      type: "article",
      publishedTime: article.date,
      url: `https://sorell.fr/blog/${slug}`,
      siteName: "Sorell",
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description: article.description,
    },
    alternates: {
      canonical: `https://sorell.fr/blog/${slug}`,
    },
  };
}

export function generateStaticParams() {
  return BLOG_ARTICLES.map((article) => ({
    slug: article.slug,
  }));
}

export default function BlogArticlePage() {
  return <BlogArticleClient />;
}
