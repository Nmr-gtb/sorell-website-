"use client";
import { useParams } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { BLOG_ARTICLES } from "@/lib/blog-articles";

export default function BlogArticlePage() {
  const params = useParams();
  const slug = params.slug as string;
  const article = BLOG_ARTICLES.find((a) => a.slug === slug);

  if (!article) {
    return (
      <div style={{ background: "var(--bg)", minHeight: "100vh" }}>
        <Navbar />
        <div style={{ maxWidth: 700, margin: "0 auto", padding: "120px 1.5rem 60px", textAlign: "center" }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--text)" }}>Article introuvable</h1>
          <Link href="/blog" style={{ color: "var(--accent)", marginTop: 16, display: "inline-block" }}>← Retour au blog</Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh" }}>
      <Navbar />
      <style>{`
        article h2 { font-size: 20px; font-weight: 600; color: var(--text); margin: 32px 0 12px; }
        article p { margin: 0 0 16px; }
        article a { color: var(--accent); text-decoration: underline; }
        article strong { color: var(--text); font-weight: 600; }
      `}</style>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Article",
            "headline": article.title,
            "description": article.description,
            "datePublished": article.date,
            "dateModified": article.date,
            "author": {
              "@type": "Organization",
              "name": "Sorell",
              "url": "https://sorell.fr"
            },
            "publisher": {
              "@type": "Organization",
              "name": "Sorell",
              "url": "https://sorell.fr"
            },
            "mainEntityOfPage": `https://sorell.fr/blog/${article.slug}`
          })
        }}
      />
      <article style={{ maxWidth: 700, margin: "0 auto", padding: "120px 1.5rem 60px" }}>
        <Link href="/blog" style={{ fontSize: 13, color: "var(--accent)", textDecoration: "none", marginBottom: 24, display: "inline-block" }}>← Retour au blog</Link>

        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          {article.tags.map((tag) => (
            <span key={tag} style={{
              padding: "2px 8px",
              borderRadius: 4,
              background: "rgba(37,99,235,0.08)",
              color: "var(--accent)",
              fontSize: 11,
              fontWeight: 600,
              textTransform: "uppercase",
            }}>
              {tag}
            </span>
          ))}
        </div>

        <h1 style={{ fontSize: 28, fontWeight: 700, color: "var(--text)", lineHeight: 1.35, marginBottom: 12 }}>
          {article.title}
        </h1>

        <div style={{ display: "flex", gap: 12, fontSize: 13, color: "var(--text-muted)", marginBottom: 32 }}>
          <span>{new Date(article.date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}</span>
          <span>·</span>
          <span>{article.readTime} de lecture</span>
        </div>

        <div
          style={{
            fontSize: 15,
            color: "var(--text-secondary)",
            lineHeight: 1.75,
          }}
          dangerouslySetInnerHTML={{ __html: article.content }}
        />

        <div style={{
          marginTop: 40,
          padding: 24,
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          textAlign: "center",
        }}>
          <h3 style={{ fontSize: 18, fontWeight: 600, color: "var(--text)", marginBottom: 8 }}>
            Automatisez votre veille en 5 minutes
          </h3>
          <p style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 16 }}>
            Essayez Sorell gratuitement - 15 jours d'essai Pro offerts, sans carte bancaire.
          </p>
          <a href="https://sorell.fr/connexion" style={{
            display: "inline-block",
            padding: "10px 24px",
            background: "var(--accent)",
            color: "white",
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 600,
            textDecoration: "none",
          }}>
            Essayer gratuitement
          </a>
        </div>
      </article>
      <Footer />
    </div>
  );
}
