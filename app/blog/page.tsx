"use client";
import { useState, useMemo } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { BLOG_ARTICLES } from "@/lib/blog-articles";

// Extraire tous les tags uniques tries par frequence
function getAllTags(): string[] {
  const tagCount: Record<string, number> = {};
  for (const article of BLOG_ARTICLES) {
    for (const tag of article.tags) {
      tagCount[tag] = (tagCount[tag] || 0) + 1;
    }
  }
  return Object.entries(tagCount)
    .sort((a, b) => b[1] - a[1])
    .map(([tag]) => tag);
}

const ALL_TAGS = getAllTags();

// Trier les articles par date decroissante
const SORTED_ARTICLES = [...BLOG_ARTICLES].sort(
  (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
);

export default function BlogPage() {
  const [search, setSearch] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);

  const filteredArticles = useMemo(() => {
    let articles = SORTED_ARTICLES;

    if (activeTag) {
      articles = articles.filter((a) => a.tags.includes(activeTag));
    }

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      articles = articles.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.description.toLowerCase().includes(q) ||
          a.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    return articles;
  }, [search, activeTag]);

  return (
    <div style={{ background: "var(--bg)", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <style>{`
        @media (max-width: 767px) {
          .blog-list-wrapper { padding-top: 100px !important; padding-bottom: 40px !important; }
          .blog-article-card { padding: 16px !important; }
          .blog-search-input { font-size: 16px !important; }
          .blog-tags-row { gap: 8px !important; }
          .blog-tag-btn { font-size: 12px !important; padding: 6px 14px !important; }
          .blog-list-wrapper h1 { font-size: 26px !important; }
        }
      `}</style>
      <Navbar />
      <div className="blog-list-wrapper" style={{ flex: 1, maxWidth: 800, margin: "0 auto", padding: "120px 1.5rem 60px", width: "100%" }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, color: "var(--text)", marginBottom: 8 }}>Blog</h1>
        <p style={{ fontSize: 15, color: "var(--text-secondary)", marginBottom: 24 }}>
          Guides, comparatifs et conseils pour automatiser votre veille sectorielle.
        </p>

        {/* Barre de recherche */}
        <div style={{ position: "relative", marginBottom: 16 }}>
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--text-muted)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            className="blog-search-input"
            type="text"
            placeholder="Rechercher un article..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%",
              padding: "12px 14px 12px 42px",
              borderRadius: 10,
              border: "1px solid var(--border)",
              background: "var(--surface)",
              color: "var(--text)",
              fontSize: 14,
              outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>

        {/* Filtres par tags */}
        <div className="blog-tags-row" style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 24 }}>
          <button
            className="blog-tag-btn"
            onClick={() => setActiveTag(null)}
            style={{
              padding: "5px 14px",
              borderRadius: 20,
              border: activeTag === null ? "1px solid var(--accent)" : "1px solid var(--border)",
              background: activeTag === null ? "var(--accent)" : "var(--surface)",
              color: activeTag === null ? "white" : "var(--text-secondary)",
              fontSize: 12,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Tous
          </button>
          {ALL_TAGS.map((tag) => (
            <button
              key={tag}
              className="blog-tag-btn"
              onClick={() => setActiveTag(activeTag === tag ? null : tag)}
              style={{
                padding: "5px 14px",
                borderRadius: 20,
                border: activeTag === tag ? "1px solid var(--accent)" : "1px solid var(--border)",
                background: activeTag === tag ? "var(--accent)" : "var(--surface)",
                color: activeTag === tag ? "white" : "var(--text-secondary)",
                fontSize: 12,
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              {tag}
            </button>
          ))}
        </div>

        {/* Compteur */}
        <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 16 }}>
          {filteredArticles.length} article{filteredArticles.length > 1 ? "s" : ""}
          {activeTag ? ` dans "${activeTag}"` : ""}
          {search.trim() ? ` pour "${search.trim()}"` : ""}
        </p>

        {/* Liste des articles */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {filteredArticles.length === 0 && (
            <div style={{ textAlign: "center", padding: "40px 0" }}>
              <p style={{ fontSize: 15, color: "var(--text-secondary)", marginBottom: 8 }}>
                Aucun article trouvé.
              </p>
              <button
                onClick={() => { setSearch(""); setActiveTag(null); }}
                style={{
                  padding: "8px 20px",
                  borderRadius: 8,
                  border: "1px solid var(--border)",
                  background: "var(--surface)",
                  color: "var(--text-secondary)",
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                Réinitialiser les filtres
              </button>
            </div>
          )}
          {filteredArticles.map((article) => (
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
              <div style={{ display: "flex", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
                {article.tags.map((tag) => (
                  <span key={tag} style={{
                    padding: "2px 8px",
                    borderRadius: 4,
                    background: activeTag === tag ? "var(--accent)" : "rgba(0,80,88,0.08)",
                    color: activeTag === tag ? "white" : "var(--accent)",
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
