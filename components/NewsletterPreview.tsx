export default function NewsletterPreview() {
  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 12,
        overflow: "hidden",
        maxWidth: 540,
        width: "100%",
        margin: "0 auto",
        fontFamily: "var(--font-inter, 'Inter', sans-serif)",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "20px 28px",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span
            style={{
              fontWeight: 700,
              fontSize: "0.9375rem",
              letterSpacing: "-0.02em",
              color: "var(--text)",
            }}
          >
            Sorel<span style={{ color: "var(--accent)" }}>l</span>
          </span>
          <span style={{ color: "var(--border-hover)", fontSize: "0.875rem" }}>·</span>
          <span style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>Groupe Verdier</span>
        </div>
        <span style={{ fontSize: "0.6875rem", color: "var(--text-muted)" }}>
          Semaine du 17 mars 2026
        </span>
      </div>

      {/* Hero image (article phare) */}
      <div style={{ position: "relative", height: 180, overflow: "hidden" }}>
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "#1E293B",
            backgroundImage:
              "repeating-linear-gradient(45deg, rgba(255,255,255,0.05) 0px, rgba(255,255,255,0.05) 1px, transparent 1px, transparent 20px)",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(to bottom, transparent 20%, rgba(0,0,0,0.72) 100%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            padding: "16px 20px",
          }}
        >
          <span
            style={{
              display: "inline-block",
              marginBottom: 8,
              padding: "2px 8px",
              borderRadius: 4,
              fontSize: "0.5625rem",
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase" as const,
              background: "rgba(37,99,235,0.9)",
              color: "white",
            }}
          >
            ARTICLE PHARE
          </span>
          <p
            style={{
              fontWeight: 700,
              fontSize: "1.0625rem",
              color: "white",
              lineHeight: 1.35,
              marginBottom: 6,
              letterSpacing: "-0.01em",
            }}
          >
            Emballages : les nouvelles normes PPWR entrent en vigueur cet été
          </p>
          <span style={{ fontSize: "0.6875rem", color: "rgba(255,255,255,0.7)" }}>
            lesechos.fr · 2j
          </span>
        </div>
      </div>

      {/* Intro */}
      <div
        style={{
          padding: "24px 28px",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <p style={{ fontSize: "0.8125rem", color: "var(--text)", lineHeight: 1.6 }}>
          <span style={{ fontWeight: 600 }}>Bonjour Anne-Claire,</span>{" "}
          <span style={{ color: "var(--text-secondary)" }}>
            voici les 5 actualités clés de votre secteur cette semaine, sélectionnées et résumées par Sorell.
          </span>
        </p>
      </div>

      {/* 2-column grid */}
      <div
        style={{
          padding: "20px 28px 0",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 14,
        }}
      >
        {/* Article 1 */}
        <div
          style={{
            border: "0.5px solid var(--border)",
            borderRadius: 8,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: 90,
              background: "#0F172A",
              backgroundImage:
                "repeating-linear-gradient(135deg, rgba(255,255,255,0.03) 0px, rgba(255,255,255,0.03) 1px, transparent 1px, transparent 16px)",
            }}
          />
          <div style={{ padding: "12px 14px" }}>
            <span
              style={{
                display: "inline-block",
                marginBottom: 6,
                padding: "2px 7px",
                borderRadius: 4,
                fontSize: "0.5625rem",
                fontWeight: 600,
                background: "#ECFDF5",
                color: "#065F46",
              }}
            >
              MARCHÉ
            </span>
            <p
              style={{
                fontSize: "0.8125rem",
                fontWeight: 600,
                color: "var(--text)",
                lineHeight: 1.35,
                marginBottom: 5,
                letterSpacing: "-0.01em",
              }}
            >
              Le packaging durable dépasse les 400Mds$ en 2026
            </p>
            <span style={{ fontSize: "0.6875rem", color: "var(--text-muted)" }}>
              businessinsights.com · 3j
            </span>
          </div>
        </div>

        {/* Article 2 */}
        <div
          style={{
            border: "0.5px solid var(--border)",
            borderRadius: 8,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: 90,
              background: "#1E3A5F",
              backgroundImage:
                "repeating-linear-gradient(135deg, rgba(255,255,255,0.03) 0px, rgba(255,255,255,0.03) 1px, transparent 1px, transparent 16px)",
            }}
          />
          <div style={{ padding: "12px 14px" }}>
            <span
              style={{
                display: "inline-block",
                marginBottom: 6,
                padding: "2px 7px",
                borderRadius: 4,
                fontSize: "0.5625rem",
                fontWeight: 600,
                background: "#EFF6FF",
                color: "#1E40AF",
              }}
            >
              INNOVATION
            </span>
            <p
              style={{
                fontSize: "0.8125rem",
                fontWeight: 600,
                color: "var(--text)",
                lineHeight: 1.35,
                marginBottom: 5,
                letterSpacing: "-0.01em",
              }}
            >
              Quadpack lance un flacon 100% recyclé pour le premium
            </p>
            <span style={{ fontSize: "0.6875rem", color: "var(--text-muted)" }}>
              premiumbeautynews.com · 1j
            </span>
          </div>
        </div>
      </div>

      {/* Highlight block */}
      <div style={{ padding: "16px 28px 0" }}>
        <div
          style={{
            display: "flex",
            gap: 14,
            padding: 16,
            borderRadius: 8,
            background: "var(--surface-alt)",
          }}
        >
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: 6,
              flexShrink: 0,
              background: "#334155",
              backgroundImage:
                "repeating-linear-gradient(45deg, rgba(255,255,255,0.03) 0px, rgba(255,255,255,0.03) 1px, transparent 1px, transparent 14px)",
            }}
          />
          <div style={{ flex: 1 }}>
            <span
              style={{
                display: "inline-block",
                marginBottom: 6,
                padding: "2px 7px",
                borderRadius: 4,
                fontSize: "0.5625rem",
                fontWeight: 600,
                background: "rgba(37,99,235,0.08)",
                color: "var(--accent)",
              }}
            >
              TENDANCE
            </span>
            <p
              style={{
                fontSize: "0.8125rem",
                fontWeight: 600,
                color: "var(--text)",
                lineHeight: 1.35,
                marginBottom: 4,
                letterSpacing: "-0.01em",
              }}
            >
              Les marques accélèrent sur le vrac : +35% de références
            </p>
            <p
              style={{
                fontSize: "0.75rem",
                color: "var(--text-secondary)",
                lineHeight: 1.5,
                marginBottom: 4,
              }}
            >
              La grande distribution et les marques cosmétiques multiplient les formats rechargeables.
            </p>
            <span style={{ fontSize: "0.6875rem", color: "var(--text-muted)" }}>
              mckinsey.com · 4j
            </span>
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <div
        style={{
          padding: "16px 28px",
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: 10,
        }}
      >
        {[
          { value: "147", label: "Sources analysées" },
          { value: "5", label: "Articles retenus" },
          { value: "3min", label: "Temps de lecture" },
        ].map((stat) => (
          <div
            key={stat.label}
            style={{
              background: "var(--surface-alt)",
              borderRadius: 8,
              padding: 12,
              textAlign: "center" as const,
            }}
          >
            <div
              style={{
                fontSize: "1.25rem",
                fontWeight: 700,
                color: "var(--accent)",
                marginBottom: 2,
              }}
            >
              {stat.value}
            </div>
            <div
              style={{
                fontSize: "0.625rem",
                color: "var(--text-muted)",
                lineHeight: 1.3,
              }}
            >
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div
        style={{
          borderTop: "1px solid var(--border)",
          padding: "16px 28px",
          textAlign: "center" as const,
        }}
      >
        <span style={{ fontSize: "0.6875rem", color: "var(--text-muted)" }}>
          Généré automatiquement par Sorel
          <span style={{ color: "var(--accent)" }}>l</span>
          {" · "}Personnalisé pour Anne-Claire Duval, Direction des opérations
        </span>
      </div>
    </div>
  );
}
