const articles = [
  {
    featured: true,
    tagClass: "email-tag-ai",
    tagLabel: "IA générative",
    title: "Claude 4.5 dépasse GPT-4o sur les benchmarks de raisonnement complexe",
    summary:
      "Anthropic publie des résultats montrant une supériorité sur 7 benchmarks clés. Les entreprises tech réévaluent leurs intégrations LLM en conséquence.",
    source: "The Verge",
  },
  {
    tagClass: "email-tag-reg",
    tagLabel: "Réglementation",
    title: "L'EU AI Act entre en vigueur : ce que ça change pour les entreprises françaises",
    summary:
      "Les obligations de transparence et d'audit s'appliquent dès ce trimestre.",
    source: "Legifrance",
  },
  {
    tagClass: "email-tag-fund",
    tagLabel: "Financement",
    title: "Mistral AI lève 600M€ en Série C pour accélérer son déploiement européen",
    summary:
      "La licorne française valorisée à 6 milliards d'euros ouvre un bureau à Berlin.",
    source: "Les Echos",
  },
  {
    tagClass: "email-tag-agents",
    tagLabel: "Agents IA",
    title: "Les agents autonomes entrent en production dans 3 ETI françaises pionnières",
    summary:
      "Support client, analyse juridique et code review — retours d'expérience concrets.",
    source: "MIT Technology Review",
  },
];

export default function NewsletterPreview() {
  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 20,
        overflow: "hidden",
        boxShadow: "var(--shadow-xl)",
      }}
    >
      {/* Email client chrome */}
      <div
        style={{
          background: "var(--surface-alt)",
          borderBottom: "1px solid var(--border)",
          padding: "10px 16px",
          display: "flex",
          flexDirection: "column",
          gap: 6,
        }}
      >
        {/* Dots */}
        <div style={{ display: "flex", gap: 6, marginBottom: 2 }}>
          {["#FF5F57", "#FEBC2E", "#28C840"].map((c) => (
            <div key={c} style={{ width: 11, height: 11, borderRadius: "50%", background: c }} />
          ))}
        </div>
        {/* Mail meta */}
        <div
          style={{
            display: "grid",
            gap: "2px",
            fontSize: "0.75rem",
            color: "var(--text-secondary)",
          }}
        >
          <span>
            <span style={{ color: "var(--text-muted)", marginRight: 4 }}>De :</span>
            <span style={{ color: "var(--text)", fontWeight: 500 }}>Sorell</span>
            <span style={{ color: "var(--text-muted)" }}> &lt;veille@sorell.fr&gt;</span>
          </span>
          <span>
            <span style={{ color: "var(--text-muted)", marginRight: 4 }}>Objet :</span>
            <span style={{ fontWeight: 500, color: "var(--text)" }}>
              Votre briefing du lundi 17 mars 2026
            </span>
          </span>
        </div>
      </div>

      {/* Email body */}
      <div style={{ padding: "20px 22px" }}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 14,
            flexWrap: "wrap",
            gap: 8,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: "50%",
                background: "var(--accent)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "var(--font-playfair, serif)",
                fontWeight: 600,
                fontSize: "0.875rem",
                color: "white",
                flexShrink: 0,
              }}
            >
              S
            </div>
            <div>
              <div
                style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--text)", lineHeight: 1.2 }}
              >
                Sorell
              </div>
              <div style={{ fontSize: "0.6875rem", color: "var(--text-muted)" }}>
                17 mars 2026 · 8h00
              </div>
            </div>
          </div>
          <span
            className="email-tag email-tag-ai"
            style={{ fontSize: "0.6875rem" }}
          >
            Veille IA & Tech
          </span>
        </div>

        {/* Greeting */}
        <p
          style={{
            fontSize: "0.8125rem",
            color: "var(--text-secondary)",
            marginBottom: 16,
            lineHeight: 1.5,
          }}
        >
          Bonjour Marie,{" "}
          <span style={{ color: "var(--text)", fontWeight: 500 }}>
            5 tendances clés
          </span>{" "}
          sélectionnées par notre IA cette semaine dans votre secteur.
        </p>

        {/* Articles */}
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {articles.map((article, i) => (
            <div key={i}>
              {i > 0 && (
                <div
                  style={{
                    height: 1,
                    background: "var(--border-subtle)",
                    margin: "10px 0",
                  }}
                />
              )}
              {article.featured ? (
                // Featured article — larger
                <div
                  style={{
                    padding: "12px 14px",
                    background: "var(--surface-alt)",
                    borderRadius: 10,
                    border: "1px solid var(--border-subtle)",
                    marginBottom: 10,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      marginBottom: 8,
                    }}
                  >
                    <span
                      style={{
                        fontSize: "0.6rem",
                        fontWeight: 700,
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        color: "var(--accent)",
                        fontFamily: "var(--font-jetbrains, monospace)",
                      }}
                    >
                      ★ Article phare
                    </span>
                    <span
                      className={`email-tag ${article.tagClass}`}
                    >
                      {article.tagLabel}
                    </span>
                  </div>
                  <p
                    className="font-display"
                    style={{
                      fontSize: "0.875rem",
                      fontWeight: 600,
                      color: "var(--text)",
                      lineHeight: 1.4,
                      marginBottom: 6,
                    }}
                  >
                    {article.title}
                  </p>
                  <p
                    style={{
                      fontSize: "0.75rem",
                      color: "var(--text-secondary)",
                      lineHeight: 1.5,
                      marginBottom: 8,
                    }}
                  >
                    {article.summary}
                  </p>
                  <span
                    style={{
                      fontSize: "0.6875rem",
                      color: "var(--text-muted)",
                      fontFamily: "var(--font-jetbrains, monospace)",
                    }}
                  >
                    Source : {article.source} ↗
                  </span>
                </div>
              ) : (
                // Regular article
                <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <span
                    className="font-mono"
                    style={{
                      fontSize: "0.6875rem",
                      fontWeight: 600,
                      color: "var(--accent)",
                      marginTop: 1,
                      flexShrink: 0,
                      width: 18,
                    }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4, flexWrap: "wrap" }}>
                      <span className={`email-tag ${article.tagClass}`}>
                        {article.tagLabel}
                      </span>
                    </div>
                    <p
                      style={{
                        fontSize: "0.8125rem",
                        fontWeight: 600,
                        color: "var(--text)",
                        lineHeight: 1.35,
                        marginBottom: 3,
                      }}
                    >
                      {article.title}
                    </p>
                    <p
                      style={{
                        fontSize: "0.75rem",
                        color: "var(--text-secondary)",
                        lineHeight: 1.45,
                        marginBottom: 4,
                      }}
                    >
                      {article.summary}
                    </p>
                    <span
                      style={{
                        fontSize: "0.6875rem",
                        color: "var(--text-muted)",
                        fontFamily: "var(--font-jetbrains, monospace)",
                      }}
                    >
                      Source : {article.source} ↗
                    </span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div
          style={{
            marginTop: 16,
            paddingTop: 12,
            borderTop: "1px solid var(--border-subtle)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 8,
          }}
        >
          <span
            className="font-mono"
            style={{ fontSize: "0.6875rem", color: "var(--text-muted)" }}
          >
            Généré par Sorell IA
          </span>
          <button
            style={{
              fontSize: "0.6875rem",
              padding: "5px 12px",
              borderRadius: 6,
              background: "var(--accent)",
              color: "white",
              border: "none",
              cursor: "pointer",
              fontWeight: 500,
            }}
          >
            Lire les 5 articles →
          </button>
        </div>
      </div>
    </div>
  );
}
