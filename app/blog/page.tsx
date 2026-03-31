"use client";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { BLOG_ARTICLES } from "@/lib/blog-articles";

export default function BlogPage() {
  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh" }}>
      <style>{`
        @media (max-width: 767px) {
          .blog-list-wrapper { padding-top: 80px !important; padding-bottom: 40px !important; }
          .blog-article-card { padding: 16px !important; }
        }
      `}</style>
      <Navbar />
      <div className="blog-list-wrapper" style={{ maxWidth: 800, margin: "0 auto", padding: "120px 1.5rem 60px" }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>Blog</h1>
        <p style={{ fontSize: 15, color: "var(--text-secondary)", marginBottom: 40 }}>
          Guides, comparatifs et conseils pour automatiser votre veille sectorielle.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {BLOG_ARTICLES.map((article) => (
            <Link
              key={article.slug}
              href={`/blog/${article.slug}`}
              className="blog-article-card"
              style={{
                textDecoration: "none",
                padding: 24,
                borderRadius: 12,
                border: "1px solid var(--border)",
                background: "var(--surface)",
                display: "block",
              }}
            >
              <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                {article.tags.map((tag) => (
                  <span key={tag} style={{
                    padding: "2px 8px",
                    borderRadius: 4,
                    background: "rgba(0,80,88,0.08)",
                    color: "var(--accent)",
                    fontSize: 11,
                    fontWeight: 600,
                    textTransform: "uppercase",
                  }}>
                    {tag}
                  </span>
                ))}
              </div>
              <h2 style={{ fontSize: 18, fontWeight: 600, color: "var(--text)", margin: "0 0 8px", lineHeight: 1.4 }}>
                {article.title}
              </h2>
              <p style={{ fontSize: 14, color: "var(--text-secondary)", margin: "0 0 12px", lineHeight: 1.6 }}>
                {article.description}
              </p>
              <div style={{ display: "flex", gap: 12, fontSize: 12, color: "var(--text-muted)" }}>
                <span>{new Date(article.date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}</span>
                <span>·</span>
                <span>{article.readTime} de lecture</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
}
