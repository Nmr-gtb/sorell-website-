export default function NewsletterPreview() {
  return (
    <div
      className="rounded-2xl overflow-hidden shadow-2xl border"
      style={{
        background: "#1a1a24",
        borderColor: "#2a2a3a",
        boxShadow: "0 24px 64px rgba(0,0,0,0.5), 0 0 0 1px rgba(124,58,237,0.08)",
      }}
    >
      {/* Window chrome */}
      <div
        className="flex items-center gap-2 px-4 py-3 border-b"
        style={{ background: "#111118", borderColor: "#1e1e2a" }}
      >
        <div className="w-3 h-3 rounded-full" style={{ background: "#ff5f57" }} />
        <div className="w-3 h-3 rounded-full" style={{ background: "#febc2e" }} />
        <div className="w-3 h-3 rounded-full" style={{ background: "#28c840" }} />
        <div
          className="ml-4 flex-1 text-center text-xs rounded-md px-3 py-1 mx-8"
          style={{ background: "#16161f", color: "#5a5a72" }}
        >
          veille@sorell.fr
        </div>
      </div>

      {/* Email header */}
      <div className="px-6 pt-5 pb-4 border-b" style={{ borderColor: "#1e1e2a" }}>
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
              style={{ background: "linear-gradient(135deg, #7c3aed, #8b5cf6)" }}
            >
              S
            </div>
            <div>
              <div className="text-sm font-medium" style={{ color: "#f0f0f5" }}>
                Sorell
              </div>
              <div className="text-xs" style={{ color: "#5a5a72" }}>
                veille@sorell.fr
              </div>
            </div>
          </div>
          <span
            className="text-xs px-2.5 py-1 rounded-full font-medium flex-shrink-0"
            style={{ background: "rgba(124,58,237,0.15)", color: "#a78bfa", border: "1px solid rgba(124,58,237,0.25)" }}
          >
            Veille IA & Tech
          </span>
        </div>
        <div className="text-base font-semibold mb-1" style={{ color: "#f0f0f5" }}>
          Votre briefing de la semaine — 17 mars 2026
        </div>
        <div className="text-sm" style={{ color: "#9090aa" }}>
          À : Marie Dupont &lt;marie@acme-corp.fr&gt;
        </div>
      </div>

      {/* Email body */}
      <div className="px-6 py-5">
        <p className="text-sm mb-5" style={{ color: "#9090aa" }}>
          Bonjour Marie, voici les{" "}
          <span className="font-semibold" style={{ color: "#f0f0f5" }}>
            5 informations clés
          </span>{" "}
          de la semaine dans votre secteur.
        </p>

        <div className="space-y-4">
          {[
            {
              num: "01",
              tag: "IA générative",
              title: "Claude 4.5 dépasse GPT-4o sur les benchmarks de raisonnement complexe",
              impact: "Élevé",
              impactColor: "#ef4444",
            },
            {
              num: "02",
              tag: "Réglementation",
              title: "L'EU AI Act entre en vigueur : ce que ça change pour les entreprises françaises",
              impact: "Critique",
              impactColor: "#f97316",
            },
            {
              num: "03",
              tag: "Financement",
              title: "Mistral AI lève 600M€ en Série C pour accélérer son déploiement européen",
              impact: "Modéré",
              impactColor: "#10b981",
            },
            {
              num: "04",
              tag: "Agents IA",
              title: "Les agents autonomes entrent en production : 3 cas d'usage concrets",
              impact: "Élevé",
              impactColor: "#ef4444",
            },
          ].map((item) => (
            <div
              key={item.num}
              className="flex gap-3 p-3 rounded-xl"
              style={{ background: "#111118" }}
            >
              <span
                className="text-xs font-bold mt-0.5 flex-shrink-0"
                style={{ color: "#7c3aed" }}
              >
                {item.num}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span
                    className="text-xs px-2 py-0.5 rounded-full"
                    style={{ background: "#16161f", color: "#9090aa", border: "1px solid #2a2a3a" }}
                  >
                    {item.tag}
                  </span>
                  <span
                    className="text-xs font-medium"
                    style={{ color: item.impactColor }}
                  >
                    ● {item.impact}
                  </span>
                </div>
                <p className="text-sm font-medium leading-snug" style={{ color: "#f0f0f5" }}>
                  {item.title}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div
          className="mt-5 pt-4 border-t flex items-center justify-between"
          style={{ borderColor: "#1e1e2a" }}
        >
          <span className="text-xs" style={{ color: "#5a5a72" }}>
            Généré par Sorell IA · sorell.fr
          </span>
          <button
            className="text-xs px-3 py-1.5 rounded-lg font-medium"
            style={{ background: "#7c3aed", color: "white" }}
          >
            Lire tous les articles →
          </button>
        </div>
      </div>
    </div>
  );
}
