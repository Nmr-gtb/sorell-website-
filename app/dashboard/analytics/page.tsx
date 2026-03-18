"use client";

const weeklyData = [
  { label: "S1", value: 45 },
  { label: "S2", value: 52 },
  { label: "S3", value: 58 },
  { label: "S4", value: 61 },
  { label: "S5", value: 65 },
  { label: "S6", value: 62 },
  { label: "S7", value: 68 },
  { label: "S8", value: 71 },
];

const topArticles = [
  { title: "Claude 4.6 Opus : record en raisonnement", clicks: 34 },
  { title: "Mistral AI lève 500M€", clicks: 28 },
  { title: "IA Act : premières sanctions", clicks: 22 },
  { title: "Les agents autonomes en entreprise", clicks: 19 },
  { title: "GPT-5 en accès anticipé", clicks: 15 },
];

const lastSends = [
  { date: "17 mars", subject: "Briefing S12", recipients: 12, open: "68%", click: "24%" },
  { date: "10 mars", subject: "Briefing S11", recipients: 12, open: "65%", click: "21%" },
  { date: "3 mars", subject: "Briefing S10", recipients: 11, open: "62%", click: "19%" },
  { date: "24 fév", subject: "Briefing S9", recipients: 11, open: "61%", click: "18%" },
];

const maxClicks = Math.max(...topArticles.map((a) => a.clicks));
const maxBar = Math.max(...weeklyData.map((d) => d.value));

export default function AnalyticsPage() {
  return (
    <div style={{ padding: 32, maxWidth: 900 }}>
      {/* Page header */}
      <div style={{ marginBottom: 32 }}>
        <h1
          style={{
            fontSize: 24,
            fontWeight: 600,
            color: "var(--text)",
            letterSpacing: "-0.02em",
            marginBottom: 6,
          }}
        >
          Analytics
        </h1>
        <p style={{ fontSize: 14, color: "var(--text-secondary)" }}>
          Suivez les performances de vos newsletters
        </p>
      </div>

      {/* Metric cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 16,
          marginBottom: 24,
        }}
        className="analytics-metrics-grid"
      >
        {[
          { label: "Taux d'ouverture", value: "68%", color: "var(--success)" },
          { label: "Taux de clic", value: "24%", color: "var(--text)" },
          { label: "Newsletters envoyées", value: "12", color: "var(--text)" },
          { label: "Destinataires actifs", value: "8/12", color: "var(--text)" },
        ].map((m) => (
          <div
            key={m.label}
            style={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              padding: 20,
            }}
          >
            <div
              style={{
                fontSize: 22,
                fontWeight: 700,
                color: m.color,
                letterSpacing: "-0.02em",
                marginBottom: 6,
              }}
            >
              {m.value}
            </div>
            <div style={{ fontSize: 13, color: "var(--text-muted)" }}>{m.label}</div>
          </div>
        ))}
      </div>

      {/* Chart section */}
      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          padding: 24,
          marginBottom: 24,
        }}
      >
        <h2
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: "var(--text-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            marginBottom: 24,
          }}
        >
          Évolution du taux d&apos;ouverture
        </h2>
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            gap: 10,
            height: 120,
          }}
        >
          {weeklyData.map((d) => (
            <div
              key={d.label}
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 6,
                height: "100%",
                justifyContent: "flex-end",
              }}
            >
              <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 500 }}>
                {d.value}%
              </span>
              <div
                style={{
                  width: "100%",
                  height: `${(d.value / maxBar) * 80}px`,
                  background: "var(--accent)",
                  borderRadius: "4px 4px 0 0",
                  opacity: 0.85,
                  minHeight: 8,
                }}
              />
              <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{d.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Top articles */}
      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          padding: 24,
          marginBottom: 24,
        }}
      >
        <h2
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: "var(--text-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            marginBottom: 16,
          }}
        >
          Top articles
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {topArticles.map((article, i) => (
            <div key={article.title} style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span
                style={{
                  width: 20,
                  fontSize: 13,
                  fontWeight: 600,
                  color: "var(--text-muted)",
                  flexShrink: 0,
                  textAlign: "right",
                }}
              >
                {i + 1}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 14,
                    color: "var(--text)",
                    marginBottom: 5,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {article.title}
                </div>
                <div
                  style={{
                    height: 4,
                    borderRadius: 2,
                    background: "var(--border)",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${(article.clicks / maxClicks) * 100}%`,
                      background: "var(--accent)",
                      borderRadius: 2,
                      opacity: 0.7,
                    }}
                  />
                </div>
              </div>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: "var(--text-secondary)",
                  flexShrink: 0,
                  width: 52,
                  textAlign: "right",
                }}
              >
                {article.clicks} clics
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Last sends table */}
      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          padding: 24,
          overflowX: "auto",
        }}
      >
        <h2
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: "var(--text-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            marginBottom: 16,
          }}
        >
          Derniers envois
        </h2>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead>
            <tr>
              {["Date", "Sujet", "Destinataires", "Taux ouverture", "Taux clic"].map((col) => (
                <th
                  key={col}
                  style={{
                    padding: "8px 12px",
                    textAlign: "left",
                    fontSize: 12,
                    fontWeight: 600,
                    color: "var(--text-muted)",
                    borderBottom: "1px solid var(--border)",
                    whiteSpace: "nowrap",
                  }}
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {lastSends.map((row, i) => (
              <tr
                key={i}
                style={{ transition: "background 0.1s ease" }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLTableRowElement).style.background = "var(--surface-hover)")}
                onMouseLeave={(e) => ((e.currentTarget as HTMLTableRowElement).style.background = "transparent")}
              >
                <td
                  style={{
                    padding: "12px",
                    color: "var(--text-secondary)",
                    borderBottom: i < lastSends.length - 1 ? "1px solid var(--border)" : "none",
                    whiteSpace: "nowrap",
                  }}
                >
                  {row.date}
                </td>
                <td
                  style={{
                    padding: "12px",
                    color: "var(--text)",
                    fontWeight: 500,
                    borderBottom: i < lastSends.length - 1 ? "1px solid var(--border)" : "none",
                  }}
                >
                  {row.subject}
                </td>
                <td
                  style={{
                    padding: "12px",
                    color: "var(--text-secondary)",
                    borderBottom: i < lastSends.length - 1 ? "1px solid var(--border)" : "none",
                    textAlign: "center",
                  }}
                >
                  {row.recipients}
                </td>
                <td
                  style={{
                    padding: "12px",
                    color: "var(--success)",
                    fontWeight: 600,
                    borderBottom: i < lastSends.length - 1 ? "1px solid var(--border)" : "none",
                    textAlign: "center",
                  }}
                >
                  {row.open}
                </td>
                <td
                  style={{
                    padding: "12px",
                    color: "var(--text-secondary)",
                    borderBottom: i < lastSends.length - 1 ? "1px solid var(--border)" : "none",
                    textAlign: "center",
                  }}
                >
                  {row.click}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <style>{`
        @media (max-width: 700px) {
          .analytics-metrics-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
        @media (max-width: 420px) {
          .analytics-metrics-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
