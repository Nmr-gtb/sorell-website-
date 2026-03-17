export default function NewsletterPreview() {
  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 16,
        overflow: "hidden",
        boxShadow: "var(--shadow-lg)",
        maxWidth: 440,
        fontSize: "0.8125rem",
        fontFamily: "var(--font-body, 'DM Sans', sans-serif)",
      }}
    >
      {/* Email header bar */}
      <div
        style={{
          background: "var(--surface-alt)",
          borderBottom: "1px solid var(--border)",
          padding: "12px 16px",
        }}
      >
        <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginBottom: 4 }}>
          <span style={{ color: "var(--text-muted)" }}>De : </span>
          <span style={{ fontWeight: 500, color: "var(--text)" }}>Sorell</span>
          <span style={{ color: "var(--text-muted)" }}> &lt;newsletter@sorell.fr&gt;</span>
          <span style={{ color: "var(--text-muted)", marginLeft: 8 }}>·</span>
          <span
            style={{
              marginLeft: 8,
              padding: "1px 7px",
              borderRadius: 4,
              background: "var(--accent-subtle)",
              color: "var(--accent)",
              fontSize: "0.6875rem",
              fontWeight: 600,
              border: "1px solid var(--accent-border)",
            }}
          >
            NovaTech
          </span>
        </div>
        <div style={{ fontSize: "0.75rem" }}>
          <span style={{ color: "var(--text-muted)" }}>Objet : </span>
          <span style={{ fontWeight: 600, color: "var(--text)" }}>
            Votre briefing IA — semaine du 17 mars 2026
          </span>
        </div>
        <div style={{ fontSize: "0.6875rem", color: "var(--text-muted)", marginTop: 4 }}>
          Pour : Marie Dupont, NovaTech
        </div>
      </div>

      {/* Email body */}
      <div style={{ padding: "20px 20px 16px" }}>
        {/* Email header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 14,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                background: "var(--accent)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "var(--font-display, Georgia, serif)",
                fontWeight: 600,
                fontSize: "0.8125rem",
                fontStyle: "italic",
                color: "white",
                flexShrink: 0,
              }}
            >
              S
            </div>
            <div>
              <div style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text)", lineHeight: 1.2 }}>
                Sorell
              </div>
              <div style={{ fontSize: "0.625rem", color: "var(--text-muted)" }}>
                NovaTech · 17 mars 2026
              </div>
            </div>
          </div>
        </div>

        {/* Greeting */}
        <p
          style={{
            fontFamily: "var(--font-display, Georgia, serif)",
            fontSize: "0.9375rem",
            fontStyle: "italic",
            color: "var(--text)",
            marginBottom: 4,
            lineHeight: 1.3,
          }}
        >
          Bonjour Marie,
        </p>
        <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginBottom: 14, lineHeight: 1.5 }}>
          Voici les tendances clés de votre secteur cette semaine.
        </p>

        {/* Divider */}
        <div style={{ height: 1, background: "var(--border)", marginBottom: 14 }} />

        {/* Featured article */}
        <div
          style={{
            padding: "12px 14px",
            background: "var(--surface-alt)",
            borderRadius: 10,
            border: "1px solid var(--accent-border)",
            marginBottom: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8, flexWrap: "wrap" }}>
            <span
              style={{
                fontSize: "0.625rem",
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "var(--accent)",
                fontFamily: "var(--font-body, sans-serif)",
              }}
            >
              ★ Article phare
            </span>
            <span className="email-tag email-tag-featured">IA</span>
          </div>
          <p
            style={{
              fontFamily: "var(--font-display, Georgia, serif)",
              fontSize: "0.875rem",
              fontWeight: 700,
              color: "var(--text)",
              lineHeight: 1.35,
              marginBottom: 6,
            }}
          >
            Anthropic dévoile Claude 4.6 Opus : une avancée majeure en raisonnement complexe
          </p>
          <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", lineHeight: 1.5, marginBottom: 6 }}>
            Le nouveau modèle d&apos;Anthropic établit un record sur les benchmarks de raisonnement et de code, surpassant GPT-4o et Gemini Ultra 2.0 selon des tests indépendants.
          </p>
          <span
            style={{
              fontSize: "0.625rem",
              color: "var(--text-muted)",
              fontFamily: "var(--font-mono, monospace)",
            }}
          >
            MIT Technology Review · 17 mars
          </span>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: "var(--border-subtle)", marginBottom: 12 }} />

        {/* Regular articles */}
        {[
          {
            tagClass: "email-tag-ai",
            tagLabel: "IA",
            title: "OpenAI lance GPT-5 en accès anticipé pour les entreprises",
            summary: "Des capacités multimodales renforcées et une fenêtre de contexte de 256K tokens.",
            source: "The Verge · 16 mars",
          },
          {
            tagClass: "email-tag-reg",
            tagLabel: "Réglementation",
            title: "L'IA Act européen entre en phase d'application pour les systèmes à haut risque",
            summary: "Les entreprises ont jusqu'au 1er août pour se mettre en conformité.",
            source: "Le Monde · 15 mars",
          },
          {
            tagClass: "email-tag-comp",
            tagLabel: "Concurrent",
            title: "Mistral AI lève 600M€ et annonce une expansion en Asie",
            summary: "La licorne française valorisée à 6 milliards accélère son déploiement B2B.",
            source: "Les Echos · 14 mars",
          },
        ].map((article, i) => (
          <div key={i}>
            {i > 0 && (
              <div style={{ height: 1, background: "var(--border-subtle)", margin: "10px 0" }} />
            )}
            <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
              <span
                style={{
                  fontFamily: "var(--font-mono, monospace)",
                  fontSize: "0.625rem",
                  fontWeight: 600,
                  color: "var(--accent)",
                  flexShrink: 0,
                  width: 16,
                  marginTop: 2,
                }}
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ marginBottom: 4 }}>
                  <span className={`email-tag ${article.tagClass}`}>{article.tagLabel}</span>
                </div>
                <p style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text)", lineHeight: 1.35, marginBottom: 3 }}>
                  {article.title}
                </p>
                <p style={{ fontSize: "0.6875rem", color: "var(--text-secondary)", lineHeight: 1.45, marginBottom: 3 }}>
                  {article.summary}
                </p>
                <span style={{ fontSize: "0.625rem", color: "var(--text-muted)", fontFamily: "var(--font-mono, monospace)" }}>
                  {article.source}
                </span>
              </div>
            </div>
          </div>
        ))}

        {/* Email footer */}
        <div
          style={{
            marginTop: 14,
            paddingTop: 12,
            borderTop: "1px solid var(--border-subtle)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 6,
          }}
        >
          <span style={{ fontSize: "0.625rem", color: "var(--text-muted)", fontFamily: "var(--font-mono, monospace)" }}>
            Généré par Sorell · Désinscription · Voir en ligne
          </span>
          <button
            style={{
              fontSize: "0.6875rem",
              padding: "4px 10px",
              borderRadius: 5,
              background: "var(--accent)",
              color: "white",
              border: "none",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            Lire →
          </button>
        </div>
      </div>
    </div>
  );
}
