"use client";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/AuthContext";
import { supabase } from "@/lib/supabase";

interface Newsletter {
  id: string;
  created_at: string;
  subject: string;
  status: string;
  content: string;
}

export default function HistoriquePage() {
  const { user } = useAuth();
  const [newsletters, setNewsletters] = useState<Newsletter[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNewsletter, setSelectedNewsletter] = useState<Newsletter | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("newsletters")
      .select("id, created_at, subject, status, content")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setNewsletters(data || []);
        setLoading(false);
      });
  }, [user]);

  // Vue détail d'une newsletter
  if (selectedNewsletter) {
    let parsedContent: any = null;
    try {
      parsedContent = typeof selectedNewsletter.content === "string"
        ? JSON.parse(selectedNewsletter.content)
        : selectedNewsletter.content;
    } catch (e) {
      // ignore
    }

    return (
      <div style={{ padding: 32, maxWidth: 800 }}>
        <button
          onClick={() => setSelectedNewsletter(null)}
          style={{
            background: "none",
            border: "none",
            color: "var(--accent)",
            fontSize: 13,
            cursor: "pointer",
            marginBottom: 24,
            padding: 0,
          }}
        >
          ← Retour à l'historique
        </button>

        <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--text)", marginBottom: 4 }}>
          {selectedNewsletter.subject || "Newsletter"}
        </h1>
        <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 24 }}>
          {new Date(selectedNewsletter.created_at).toLocaleDateString("fr-FR", {
            day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit"
          })}
        </p>

        {parsedContent ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Éditorial */}
            {parsedContent.editorial && (
              <div style={{
                padding: 16,
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: 10,
                borderLeft: "3px solid var(--accent)",
              }}>
                <p style={{ fontSize: 11, fontWeight: 600, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.05em", margin: "0 0 8px" }}>Éditorial</p>
                <p style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.6, margin: 0, fontStyle: "italic" }}>{parsedContent.editorial}</p>
              </div>
            )}

            {/* Article phare */}
            {parsedContent.featuredArticle && (
              <div style={{
                padding: 16,
                background: "#1F2937",
                borderRadius: 10,
              }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: "white", background: "var(--accent)", padding: "3px 8px", borderRadius: 4, textTransform: "uppercase" }}>Article phare</span>
                <h2 style={{ fontSize: 17, fontWeight: 600, color: "white", margin: "10px 0 6px" }}>{parsedContent.featuredArticle.title}</h2>
                {parsedContent.featuredArticle.hook && <p style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", fontStyle: "italic", margin: "0 0 8px" }}>{parsedContent.featuredArticle.hook}</p>}
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.85)", lineHeight: 1.6, margin: "0 0 8px" }}>{parsedContent.featuredArticle.content || parsedContent.featuredArticle.summary}</p>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.5)" }}>Source : {parsedContent.featuredArticle.source}</span>
              </div>
            )}

            {/* Autres articles */}
            {parsedContent.articles?.map((article: any, i: number) => (
              <div key={i} style={{
                padding: 16,
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: 10,
              }}>
                <span style={{ fontSize: 10, fontWeight: 600, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.04em" }}>{article.tag}</span>
                <h3 style={{ fontSize: 15, fontWeight: 600, color: "var(--text)", margin: "6px 0" }}>{article.title}</h3>
                {article.hook && <p style={{ fontSize: 13, color: "var(--text-secondary)", fontStyle: "italic", margin: "0 0 6px" }}>{article.hook}</p>}
                <p style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6, margin: "0 0 8px" }}>{article.content || article.summary}</p>
                <span style={{ fontSize: 11, color: "var(--text-muted)" }}>Source : {article.source}</span>
              </div>
            ))}

            {/* Chiffres clés */}
            {parsedContent.keyFigures?.length > 0 && (
              <div style={{ display: "flex", gap: 12 }}>
                {parsedContent.keyFigures.map((fig: any, i: number) => (
                  <div key={i} style={{
                    flex: 1,
                    padding: 12,
                    background: "var(--surface)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    textAlign: "center",
                  }}>
                    <div style={{ fontSize: 20, fontWeight: 700, color: "var(--accent)" }}>{fig.value}</div>
                    <div style={{ fontSize: 12, color: "var(--text-secondary)", fontWeight: 500 }}>{fig.label}</div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{fig.context}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <p style={{ color: "var(--text-muted)" }}>Contenu indisponible.</p>
        )}
      </div>
    );
  }

  // Vue liste
  return (
    <div style={{ padding: 32, maxWidth: 800 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: "var(--text)", marginBottom: 4 }}>Historique</h1>
      <p style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 24 }}>Toutes vos newsletters passées.</p>

      {loading ? (
        <p style={{ fontSize: 14, color: "var(--text-muted)" }}>Chargement...</p>
      ) : newsletters.length === 0 ? (
        <div style={{
          padding: 32,
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 10,
          textAlign: "center",
        }}>
          <p style={{ fontSize: 14, fontWeight: 500, color: "var(--text)" }}>Aucune newsletter pour le moment</p>
          <p style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 16 }}>Vos newsletters apparaîtront ici après leur génération.</p>
          <a href="/dashboard/generate" style={{
            display: "inline-block",
            padding: "8px 20px",
            background: "var(--accent)",
            color: "white",
            borderRadius: 6,
            fontSize: 13,
            fontWeight: 600,
            textDecoration: "none",
          }}>Générer ma première newsletter →</a>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {newsletters.map((nl) => (
            <button
              key={nl.id}
              onClick={() => setSelectedNewsletter(nl)}
              style={{
                padding: "16px 20px",
                background: "var(--surface)",
                border: "1px solid var(--border)",
                borderRadius: 10,
                cursor: "pointer",
                textAlign: "left",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <p style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", margin: "0 0 4px" }}>
                  {nl.subject || "Newsletter"}
                </p>
                <p style={{ fontSize: 12, color: "var(--text-muted)", margin: 0 }}>
                  {new Date(nl.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                </p>
              </div>
              <span style={{
                fontSize: 11,
                padding: "3px 8px",
                borderRadius: 4,
                background: nl.status === "sent" ? "rgba(16,185,129,0.1)" : "rgba(245,158,11,0.1)",
                color: nl.status === "sent" ? "#059669" : "#D97706",
                fontWeight: 500,
              }}>
                {nl.status === "sent" ? "Envoyée" : "Brouillon"}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
