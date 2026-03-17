export default function NewsletterPreview() {
  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 12,
        overflow: "hidden",
        maxWidth: 520,
        width: "100%",
        margin: "0 auto",
        fontFamily: "var(--font-inter, 'Inter', sans-serif)",
        fontSize: "0.8125rem",
      }}
    >
      {/* Card body */}
      <div style={{ padding: "28px 32px" }}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 16,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span
              style={{
                fontFamily: "var(--font-inter, 'Inter', sans-serif)",
                fontWeight: 700,
                fontSize: "0.9375rem",
                letterSpacing: "-0.02em",
                color: "var(--text)",
              }}
            >
              Sorel<span style={{ color: "var(--accent)" }}>l</span>
            </span>
            <span style={{ color: "var(--border-hover)", fontSize: "0.875rem" }}>·</span>
            <span style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", fontWeight: 400 }}>NovaTech</span>
          </div>
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>17 mars</span>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: "var(--border)", marginBottom: 16 }} />

        {/* Title */}
        <p style={{ fontWeight: 600, fontSize: "0.9375rem", color: "var(--text)", marginBottom: 6, letterSpacing: "-0.01em" }}>
          Votre briefing — Semaine du 17 mars
        </p>
        <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", marginBottom: 20, lineHeight: 1.55 }}>
          Bonjour Marie, 5 infos clés de votre secteur cette semaine.
        </p>

        {/* Featured article */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
            <span
              style={{
                fontSize: "0.625rem",
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "var(--accent)",
              }}
            >
              ARTICLE PHARE
            </span>
          </div>
          <p style={{ fontWeight: 600, fontSize: "0.875rem", color: "var(--text)", lineHeight: 1.4, marginBottom: 5, letterSpacing: "-0.01em" }}>
            Anthropic dévoile Claude 4.6 Opus : une avancée majeure en raisonnement complexe
          </p>
          <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", lineHeight: 1.55, marginBottom: 5 }}>
            Le nouveau modèle établit un record sur les benchmarks de raisonnement, surpassant GPT-4o et Gemini Ultra 2.0.
          </p>
          <span style={{ fontSize: "0.6875rem", color: "var(--text-muted)" }}>
            techcrunch.com · 2j
          </span>
        </div>

        {/* Articles list */}
        {[
          {
            tag: "IA",
            tagClass: "email-tag-ai",
            title: "OpenAI lance GPT-5 en accès anticipé pour les entreprises",
            summary: "Capacités multimodales renforcées, fenêtre de contexte 256K tokens.",
            source: "The Verge · 3j",
          },
          {
            tag: "Réglementation",
            tagClass: "email-tag-reg",
            title: "L'IA Act entre en phase d'application pour les systèmes à haut risque",
            summary: "Les entreprises ont jusqu'au 1er août pour se conformer.",
            source: "Le Monde · 4j",
          },
          {
            tag: "Concurrent",
            tagClass: "email-tag-comp",
            title: "Mistral AI lève 600M€ et annonce une expansion en Asie",
            summary: "La licorne française accélère son déploiement B2B.",
            source: "Les Echos · 5j",
          },
        ].map((article, i) => (
          <div key={i}>
            <div style={{ height: 1, background: "var(--border)", margin: "12px 0" }} />
            <div>
              <div style={{ marginBottom: 5 }}>
                <span className={`email-tag ${article.tagClass}`}>{article.tag}</span>
              </div>
              <p style={{ fontWeight: 600, fontSize: "0.8125rem", color: "var(--text)", lineHeight: 1.35, marginBottom: 3, letterSpacing: "-0.01em" }}>
                {article.title}
              </p>
              <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", lineHeight: 1.5, marginBottom: 3 }}>
                {article.summary}
              </p>
              <span style={{ fontSize: "0.6875rem", color: "var(--text-muted)" }}>
                {article.source}
              </span>
            </div>
          </div>
        ))}

        {/* Footer */}
        <div
          style={{
            marginTop: 16,
            paddingTop: 14,
            borderTop: "1px solid var(--border)",
            textAlign: "center",
          }}
        >
          <span style={{ fontSize: "0.6875rem", color: "var(--text-muted)" }}>
            Généré automatiquement par Sorell
          </span>
        </div>
      </div>
    </div>
  );
}
