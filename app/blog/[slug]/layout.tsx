import type { Metadata } from "next";
import { BLOG_ARTICLES } from "@/lib/blog-articles";

interface BlogSlugLayoutProps {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = BLOG_ARTICLES.find((a) => a.slug === slug);

  if (!article) {
    return {
      title: "Article introuvable",
      description: "Cet article n'existe pas ou a été supprimé.",
    };
  }

  return {
    title: article.title,
    description: article.description,
    openGraph: {
      type: "article",
      locale: "fr_FR",
      url: `https://sorell.fr/blog/${article.slug}`,
      siteName: "Sorell",
      title: article.title,
      description: article.description,
      publishedTime: article.date,
      modifiedTime: article.date,
      authors: ["Sorell"],
      tags: article.tags,
      images: [
        {
          url: "/og-image.svg",
          width: 1200,
          height: 630,
          alt: article.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description: article.description,
      images: ["/og-image.svg"],
    },
    alternates: {
      canonical: `https://sorell.fr/blog/${article.slug}`,
    },
  };
}

export default async function BlogSlugLayout({ children, params }: BlogSlugLayoutProps) {
  const { slug } = await params;
  const article = BLOG_ARTICLES.find((a) => a.slug === slug);

  return (
    <>
      {article && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Article",
              headline: article.title,
              description: article.description,
              datePublished: article.date,
              dateModified: article.date,
              author: {
                "@type": "Organization",
                name: "Sorell",
                url: "https://sorell.fr",
              },
              publisher: {
                "@type": "Organization",
                name: "Sorell",
                url: "https://sorell.fr",
                logo: {
                  "@type": "ImageObject",
                  url: "https://sorell.fr/icone.png",
                },
              },
              mainEntityOfPage: {
                "@type": "WebPage",
                "@id": `https://sorell.fr/blog/${article.slug}`,
              },
              keywords: article.tags.join(", "),
              wordCount: article.content.split(/\s+/).length,
              articleSection: article.tags[0] || "Blog",
            }),
          }}
        />
      )}
      {children}
    </>
  );
}
