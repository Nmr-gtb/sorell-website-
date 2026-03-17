"use client";

import { useState } from "react";
import WaitlistForm from "./WaitlistForm";

type Article = {
  tagClass: string;
  tagLabel: string;
  title: string;
  summary: string;
  source: string;
  featured?: boolean;
};

type SectorData = {
  tag: string;
  articles: Article[];
};

const SECTOR_CONTENT: Record<string, SectorData> = {
  "tech-ia": {
    tag: "Veille IA & Tech",
    articles: [
      {
        featured: true,
        tagClass: "email-tag-featured",
        tagLabel: "IA",
        title: "L'IA générative transforme le secteur tech en 2026 : bilan et perspectives",
        summary: "Agents autonomes, multimodalité et souveraineté des données s'imposent comme les tendances dominantes. Les entreprises françaises accélèrent leurs déploiements.",
        source: "McKinsey",
      },
      {
        tagClass: "email-tag-ai",
        tagLabel: "IA",
        title: "OpenAI lance GPT-5 en accès anticipé pour les entreprises",
        summary: "Capacités multimodales renforcées et fenêtre de contexte de 256K tokens. Les premiers retours d'entreprises pilotes sont très positifs.",
        source: "The Verge",
      },
      {
        tagClass: "email-tag-ai",
        tagLabel: "Modèles",
        title: "Anthropic dévoile Claude 4.6 Opus : record sur les benchmarks de raisonnement",
        summary: "Le nouveau modèle surpasse GPT-4o et Gemini Ultra 2.0 sur 12 benchmarks indépendants. Disponible via API dès maintenant.",
        source: "MIT Technology Review",
      },
      {
        tagClass: "email-tag-comp",
        tagLabel: "Concurrent",
        title: "Mistral AI lève 600M€ et annonce une expansion en Asie",
        summary: "La licorne française valorisée à 6 milliards accélère son déploiement B2B et ouvre des bureaux à Tokyo et Singapour.",
        source: "Les Echos",
      },
    ],
  },
  "finance": {
    tag: "Veille Finance & Marchés",
    articles: [
      {
        featured: true,
        tagClass: "email-tag-featured",
        tagLabel: "BCE",
        title: "Les taux BCE et leur impact sur les fintechs : analyse du T1 2026",
        summary: "Maintien des taux à 2,5% avec signal d'une possible baisse au T3. Les néobanques revoient leur modèle de revenus face à un environnement de taux plus bas.",
        source: "BCE",
      },
      {
        tagClass: "email-tag-reg",
        tagLabel: "Crypto",
        title: "MiCA pleinement opérationnel : les exchanges s'adaptent",
        summary: "Binance et Coinbase ont soumis leurs dossiers PSAN+. Le cadre réglementaire européen renforce la confiance des institutionnels.",
        source: "AMF",
      },
      {
        tagClass: "email-tag-comp",
        tagLabel: "Néobanques",
        title: "Revolut dépasse 3M de clients en France après obtention de sa licence",
        summary: "La fintech britannique peut désormais proposer des crédits immobiliers. Les banques traditionnelles accélèrent leur transformation digitale.",
        source: "Les Echos",
      },
      {
        tagClass: "email-tag-ai",
        tagLabel: "ESG",
        title: "CSRD : 50 000 entreprises françaises doivent publier leur bilan carbone",
        summary: "L'entrée en vigueur progressive jusqu'en 2026 crée une forte demande pour les cabinets de conseil ESG.",
        source: "EFRAG",
      },
    ],
  },
  "sante": {
    tag: "Veille Santé & Biotech",
    articles: [
      {
        featured: true,
        tagClass: "email-tag-featured",
        tagLabel: "IA médicale",
        title: "L'IA diagnostique les cancers du sein avec 94% de précision : premiers essais cliniques",
        summary: "Une étude publiée dans The Lancet valide l'utilisation clinique de l'outil DeepMind. Douze hôpitaux français participent au programme pilote.",
        source: "The Lancet",
      },
      {
        tagClass: "email-tag-ai",
        tagLabel: "Télémédecine",
        title: "Déserts médicaux : les téléconsultations augmentent de 62% en zone rurale",
        summary: "Le gouvernement annonce 2 000 postes de médecins salariés. Les plateformes de télémédecine affichent une croissance à deux chiffres.",
        source: "DREES",
      },
      {
        tagClass: "email-tag-reg",
        tagLabel: "Réglementation",
        title: "Réforme du remboursement des dispositifs médicaux connectés",
        summary: "La HAS publie une nouvelle grille d'évaluation. Les startups healthtech disposent de 6 mois pour mettre leurs dossiers à jour.",
        source: "HAS",
      },
      {
        tagClass: "email-tag-comp",
        tagLabel: "Biotech",
        title: "Alzheimer : nouvelle molécule réduit la progression de 35% en phase 2",
        summary: "Résultats préliminaires encourageants du laboratoire BioArctic. La phase 3 impliquera 8 000 patients sur 3 continents.",
        source: "NEJM",
      },
    ],
  },
  "retail": {
    tag: "Veille Retail & Commerce",
    articles: [
      {
        featured: true,
        tagClass: "email-tag-featured",
        tagLabel: "Commerce unifié",
        title: "Le commerce unifié redéfinit l'expérience client en 2026",
        summary: "Magasin physique, e-commerce et réseaux sociaux s'intègrent dans un parcours client sans couture. Les marques qui ont adopté cette approche affichent +28% de conversion.",
        source: "FEVAD",
      },
      {
        tagClass: "email-tag-ai",
        tagLabel: "IA retail",
        title: "TikTok Shop capte 28% des achats impulsifs chez les 18-34 ans",
        summary: "Le social commerce dépasse Amazon sur ce segment. Les marques réallouent leurs budgets digitaux en conséquence.",
        source: "FEVAD",
      },
      {
        tagClass: "email-tag-comp",
        tagLabel: "Logistique",
        title: "Crise du dernier kilomètre : les coûts logistiques en hausse de 22%",
        summary: "Nouvelles ZFE et hausse du carburant complexifient les livraisons urbaines. La mutualisation entre retailers s'accélère.",
        source: "L'Usine Nouvelle",
      },
      {
        tagClass: "email-tag-reg",
        tagLabel: "Tendances",
        title: "67% des Français intègrent l'impact environnemental dans leurs achats",
        summary: "La durabilité dépasse le prix comme critère d'achat sur le segment supérieur à 50€. Les certifications B Corp et Ecodesign gagnent en visibilité.",
        source: "OpinionWay",
      },
    ],
  },
  "industrie": {
    tag: "Veille Industrie & Énergie",
    articles: [
      {
        featured: true,
        tagClass: "email-tag-featured",
        tagLabel: "Industrie 4.0",
        title: "L'industrie 4.0 accélère dans les PME françaises : ROI en 8 mois",
        summary: "Les jumeaux numériques réduisent les arrêts de production de 25%. Un rapport Siemens sur 150 usines confirme un retour sur investissement moyen en moins d'un an.",
        source: "Siemens",
      },
      {
        tagClass: "email-tag-ai",
        tagLabel: "Robotique",
        title: "Airbus accélère : 3 000 robots supplémentaires dans ses lignes d'assemblage",
        summary: "Investissement de 2Md€. La reconversion de 1 800 opérateurs vers la maintenance robotique est déjà amorcée.",
        source: "Airbus IR",
      },
      {
        tagClass: "email-tag-comp",
        tagLabel: "Supply chain",
        title: "Semi-conducteurs : 12 mois d'attente pour certaines puces spécialisées",
        summary: "Les constructeurs automobiles ajustent leurs plans de production. L'UE accélère le Chips Act et annonce 43Md€ d'investissements.",
        source: "Bloomberg",
      },
      {
        tagClass: "email-tag-reg",
        tagLabel: "Décarbonation",
        title: "France : 40% d'énergie renouvelable dans le mix électrique — record historique",
        summary: "L'éolien offshore breton y contribue pour 8%. RTE prévoit 55% de renouvelables d'ici 2028.",
        source: "RTE",
      },
    ],
  },
  "autre": {
    tag: "Veille Générale Business",
    articles: [
      {
        featured: true,
        tagClass: "email-tag-featured",
        tagLabel: "IA",
        title: "Les 5 tendances IA qui vont transformer les entreprises françaises en 2026",
        summary: "Agents autonomes, IA multimodale, edge computing, souveraineté et gouvernance des données — analyse complète McKinsey.",
        source: "McKinsey",
      },
      {
        tagClass: "email-tag-ai",
        tagLabel: "Travail",
        title: "3 jours bureau / 2 jours remote devient la norme dans les grandes entreprises",
        summary: "74% des cadres en mode hybride selon le baromètre Malakoff Humanis 2026. Les espaces de coworking enregistrent une forte croissance.",
        source: "Malakoff Humanis",
      },
      {
        tagClass: "email-tag-comp",
        tagLabel: "Cybersécurité",
        title: "Ransomware : +45% d'attaques sur les PME françaises",
        summary: "12% seulement sont assurées. L'ANSSI publie un guide de résilience et recommande la mise en place d'un plan de continuité d'activité.",
        source: "ANSSI",
      },
      {
        tagClass: "email-tag-reg",
        tagLabel: "Écosystème",
        title: "Record : 8,3Md€ levés par les start-up françaises au T1 2026",
        summary: "La French Tech résiste malgré le contexte macro. IA, deeptech et greentech captent 60% des montants levés.",
        source: "France Digitale",
      },
    ],
  },
};

const LOADING_MESSAGES = [
  "Analyse des sources sectorielles...",
  "Sélection des contenus pertinents...",
  "Personnalisation par profil...",
  "Génération du briefing...",
  "Mise en forme finale...",
];

function DemoNewsletterResult({
  data,
  sector,
  companyName,
}: {
  data: SectorData;
  sector: string;
  companyName: string;
}) {
  const sectorLabels: Record<string, string> = {
    "tech-ia": "Tech / IA",
    finance: "Finance",
    sante: "Santé",
    retail: "Retail",
    industrie: "Industrie",
    autre: "Général",
  };

  const displayCompany = companyName.trim() || "votre entreprise";

  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 16,
        overflow: "hidden",
        boxShadow: "var(--shadow-xl)",
        fontFamily: "var(--font-body, 'DM Sans', sans-serif)",
        fontSize: "0.8125rem",
      }}
    >
      {/* Email header */}
      <div
        style={{
          background: "var(--surface-alt)",
          borderBottom: "1px solid var(--border)",
          padding: "12px 18px",
        }}
      >
        <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginBottom: 4 }}>
          <span style={{ color: "var(--text-muted)" }}>De : </span>
          <span style={{ fontWeight: 500, color: "var(--text)" }}>Sorell</span>
          <span style={{ color: "var(--text-muted)" }}> &lt;newsletter@sorell.fr&gt;</span>
        </div>
        <div style={{ fontSize: "0.75rem" }}>
          <span style={{ color: "var(--text-muted)" }}>Objet : </span>
          <span style={{ fontWeight: 600, color: "var(--text)" }}>
            Votre briefing {sectorLabels[sector] || "général"} — semaine du 17 mars 2026
          </span>
        </div>
        <div style={{ fontSize: "0.6875rem", color: "var(--text-muted)", marginTop: 4 }}>
          Pour : {displayCompany}
        </div>
      </div>

      <div style={{ padding: "20px 22px" }}>
        {/* Sender row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 12,
            flexWrap: "wrap",
            gap: 8,
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
                fontStyle: "italic",
                fontSize: "0.875rem",
                color: "white",
                flexShrink: 0,
              }}
            >
              S
            </div>
            <div>
              <div style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--text)", lineHeight: 1.2 }}>
                Sorell
              </div>
              <div style={{ fontSize: "0.625rem", color: "var(--text-muted)" }}>
                17 mars 2026 · 8h00
              </div>
            </div>
          </div>
          <span className="email-tag email-tag-ai" style={{ fontSize: "0.6875rem" }}>
            {data.tag}
          </span>
        </div>

        <p
          style={{
            fontFamily: "var(--font-display, Georgia, serif)",
            fontSize: "0.9375rem",
            fontStyle: "italic",
            color: "var(--text)",
            marginBottom: 4,
          }}
        >
          Bonjour,
        </p>
        <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginBottom: 14, lineHeight: 1.5 }}>
          <span style={{ fontWeight: 600, color: "var(--text)" }}>{data.articles.length} actualités clés</span>{" "}
          sélectionnées cette semaine pour {displayCompany}.
        </p>

        <div style={{ height: 1, background: "var(--border)", marginBottom: 14 }} />

        {/* Articles */}
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {data.articles.map((article, i) => (
            <div key={i}>
              {i > 0 && (
                <div style={{ height: 1, background: "var(--border-subtle)", margin: "12px 0" }} />
              )}
              {article.featured ? (
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
                      }}
                    >
                      ★ Article phare
                    </span>
                    <span className={`email-tag ${article.tagClass}`}>{article.tagLabel}</span>
                  </div>
                  <p
                    style={{
                      fontFamily: "var(--font-display, Georgia, serif)",
                      fontSize: "0.9375rem",
                      fontWeight: 700,
                      color: "var(--text)",
                      lineHeight: 1.35,
                      marginBottom: 6,
                    }}
                  >
                    {article.title}
                  </p>
                  <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", lineHeight: 1.55, marginBottom: 8 }}>
                    {article.summary}
                  </p>
                  <span
                    style={{
                      fontSize: "0.625rem",
                      color: "var(--text-muted)",
                      fontFamily: "var(--font-mono, monospace)",
                    }}
                  >
                    Source : {article.source} ↗
                  </span>
                </div>
              ) : (
                <div style={{ display: "flex", gap: 10 }}>
                  <span
                    style={{
                      fontFamily: "var(--font-mono, monospace)",
                      fontSize: "0.625rem",
                      fontWeight: 600,
                      color: "var(--accent)",
                      flexShrink: 0,
                      width: 18,
                      marginTop: 2,
                    }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ marginBottom: 4 }}>
                      <span className={`email-tag ${article.tagClass}`}>{article.tagLabel}</span>
                    </div>
                    <p style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--text)", lineHeight: 1.35, marginBottom: 4 }}>
                      {article.title}
                    </p>
                    <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", lineHeight: 1.5, marginBottom: 4 }}>
                      {article.summary}
                    </p>
                    <span style={{ fontSize: "0.625rem", color: "var(--text-muted)", fontFamily: "var(--font-mono, monospace)" }}>
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
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 8,
          }}
        >
          <span style={{ fontSize: "0.625rem", color: "var(--text-muted)", fontFamily: "var(--font-mono, monospace)" }}>
            Généré par Sorell · Désinscription · Voir en ligne
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
              fontWeight: 600,
            }}
          >
            Lire tous les articles →
          </button>
        </div>
      </div>
    </div>
  );
}

export default function DemoGenerator() {
  const [sector, setSector] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [loading, setLoading] = useState(false);
  const [msgIdx, setMsgIdx] = useState(0);
  const [result, setResult] = useState<SectorData | null>(null);
  const [currentSector, setCurrentSector] = useState("");
  const [showWaitlist, setShowWaitlist] = useState(false);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sector) return;
    setLoading(true);
    setResult(null);
    setShowWaitlist(false);
    setCurrentSector(sector);
    let idx = 0;
    setMsgIdx(0);
    const interval = setInterval(() => {
      idx = (idx + 1) % LOADING_MESSAGES.length;
      setMsgIdx(idx);
    }, 800);
    await new Promise((r) => setTimeout(r, 4000));
    clearInterval(interval);
    setResult(SECTOR_CONTENT[sector] || SECTOR_CONTENT["autre"]);
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: 760, margin: "0 auto" }}>
      {/* Config form */}
      <div
        className="card"
        style={{ padding: "32px", marginBottom: 28 }}
      >
        <h2
          style={{
            fontFamily: "var(--font-display, Georgia, serif)",
            fontSize: "1.375rem",
            fontWeight: 600,
            color: "var(--text)",
            marginBottom: 6,
          }}
        >
          Configurez votre briefing
        </h2>
        <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginBottom: 28 }}>
          Remplissez les champs ci-dessous et notre IA génère un aperçu en quelques secondes.
        </p>

        <form onSubmit={handleGenerate} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div>
            <label
              style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, color: "var(--text)", marginBottom: 8 }}
            >
              Votre secteur d&apos;activité{" "}
              <span style={{ color: "var(--accent)" }}>*</span>
            </label>
            <select
              value={sector}
              onChange={(e) => setSector(e.target.value)}
              required
              className="select-field"
            >
              <option value="" disabled>Choisissez votre secteur...</option>
              <option value="tech-ia">Tech / IA</option>
              <option value="finance">Finance & Banque</option>
              <option value="sante">Santé & Biotech</option>
              <option value="retail">Retail & Commerce</option>
              <option value="industrie">Industrie & Énergie</option>
              <option value="autre">Autre secteur</option>
            </select>
          </div>

          <div>
            <label
              style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, color: "var(--text)", marginBottom: 8 }}
            >
              Nom de votre entreprise{" "}
              <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>(optionnel)</span>
            </label>
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="ex : Acme Corp, NovaTech, votre startup..."
              className="input-field"
            />
          </div>

          <button
            type="submit"
            disabled={!sector || loading}
            className="btn-primary"
            style={{
              padding: "13px",
              fontSize: "0.9375rem",
              fontWeight: 600,
              opacity: !sector ? 0.5 : 1,
              cursor: !sector ? "not-allowed" : "pointer",
              justifyContent: "center",
              marginTop: 4,
            }}
          >
            {loading ? (
              <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" opacity="0.25" />
                  <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                Génération en cours...
              </span>
            ) : (
              "Générer mon briefing →"
            )}
          </button>
        </form>
      </div>

      {/* Loading state */}
      {loading && (
        <div
          style={{
            padding: "40px 32px",
            textAlign: "center",
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 16,
            marginBottom: 28,
          }}
        >
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: "50%",
              margin: "0 auto 20px",
              position: "relative",
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: "50%",
                border: "2px solid var(--border)",
              }}
            />
            <div
              className="animate-spin"
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: "50%",
                border: "2px solid transparent",
                borderTopColor: "var(--accent)",
              }}
            />
            <div
              style={{
                position: "absolute",
                inset: "10px",
                borderRadius: "50%",
                background: "var(--accent-subtle)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "var(--font-display, Georgia, serif)",
                fontStyle: "italic",
                fontSize: "0.875rem",
                fontWeight: 600,
                color: "var(--accent)",
              }}
            >
              S
            </div>
          </div>
          <p
            style={{
              fontFamily: "var(--font-body, sans-serif)",
              fontWeight: 600,
              color: "var(--text)",
              fontSize: "0.9375rem",
              marginBottom: 6,
            }}
          >
            {LOADING_MESSAGES[msgIdx]}
          </p>
          <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", marginBottom: 20 }}>
            Analyse de centaines de sources en temps réel
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: 5 }}>
            {LOADING_MESSAGES.map((_, i) => (
              <div
                key={i}
                style={{
                  height: 3,
                  borderRadius: 2,
                  transition: "all 0.3s ease",
                  width: i === msgIdx ? 24 : 6,
                  background: i === msgIdx ? "var(--accent)" : "var(--border)",
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Result */}
      {result && !loading && (
        <div
          style={{
            opacity: 1,
            transform: "translateY(0)",
            transition: "opacity 0.5s ease, transform 0.5s ease",
          }}
        >
          <DemoNewsletterResult data={result} sector={currentSector} companyName={companyName} />

          {/* Post-result CTA */}
          <div
            style={{
              marginTop: 24,
              padding: "28px 32px",
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 16,
              textAlign: "center",
            }}
          >
            {!showWaitlist ? (
              <>
                <p
                  style={{
                    fontFamily: "var(--font-display, Georgia, serif)",
                    fontSize: "1.25rem",
                    fontWeight: 600,
                    fontStyle: "italic",
                    color: "var(--text)",
                    marginBottom: 6,
                  }}
                >
                  Vous aimez ce que vous voyez&nbsp;?
                </p>
                <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginBottom: 20 }}>
                  Recevez ce briefing chaque semaine, personnalisé pour votre équipe.
                </p>
                <button
                  onClick={() => setShowWaitlist(true)}
                  className="btn-primary"
                  style={{ padding: "11px 28px", fontSize: "0.9375rem", fontWeight: 600 }}
                >
                  Recevoir cette newsletter chaque semaine →
                </button>
              </>
            ) : (
              <>
                <p style={{ fontWeight: 600, color: "var(--text)", fontSize: "1rem", marginBottom: 4 }}>
                  Rejoignez la waitlist
                </p>
                <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginBottom: 20 }}>
                  Gratuit. Pas de spam. Recevez un échantillon dès votre inscription.
                </p>
                <div style={{ display: "flex", justifyContent: "center" }}>
                  <WaitlistForm />
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
