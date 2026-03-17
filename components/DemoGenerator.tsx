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
        summary: "Capacités multimodales renforcées et fenêtre de contexte de 256K tokens.",
        source: "The Verge",
      },
      {
        tagClass: "email-tag-ai",
        tagLabel: "Modèles",
        title: "Anthropic dévoile Claude 4.6 Opus : record sur les benchmarks de raisonnement",
        summary: "Le nouveau modèle surpasse GPT-4o et Gemini Ultra 2.0 sur 12 benchmarks indépendants.",
        source: "MIT Technology Review",
      },
      {
        tagClass: "email-tag-comp",
        tagLabel: "Concurrent",
        title: "Mistral AI lève 600M€ et annonce une expansion en Asie",
        summary: "La licorne française valorisée à 6 milliards accélère son déploiement B2B.",
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
        summary: "Maintien des taux à 2,5% avec signal d'une possible baisse au T3. Les néobanques revoient leur modèle de revenus.",
        source: "BCE",
      },
      {
        tagClass: "email-tag-reg",
        tagLabel: "Crypto",
        title: "MiCA pleinement opérationnel : les exchanges s'adaptent",
        summary: "Binance et Coinbase ont soumis leurs dossiers PSAN+. Le cadre réglementaire européen renforce la confiance.",
        source: "AMF",
      },
      {
        tagClass: "email-tag-comp",
        tagLabel: "Néobanques",
        title: "Revolut dépasse 3M de clients en France après obtention de sa licence",
        summary: "La fintech britannique peut désormais proposer des crédits immobiliers.",
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
        summary: "Une étude publiée dans The Lancet valide l'utilisation clinique de l'outil DeepMind. Douze hôpitaux français participent.",
        source: "The Lancet",
      },
      {
        tagClass: "email-tag-ai",
        tagLabel: "Télémédecine",
        title: "Déserts médicaux : les téléconsultations augmentent de 62% en zone rurale",
        summary: "Le gouvernement annonce 2 000 postes de médecins salariés. Les plateformes de télémédecine affichent une forte croissance.",
        source: "DREES",
      },
      {
        tagClass: "email-tag-reg",
        tagLabel: "Réglementation",
        title: "Réforme du remboursement des dispositifs médicaux connectés",
        summary: "La HAS publie une nouvelle grille d'évaluation. Les startups healthtech ont 6 mois pour se mettre à jour.",
        source: "HAS",
      },
      {
        tagClass: "email-tag-comp",
        tagLabel: "Biotech",
        title: "Alzheimer : nouvelle molécule réduit la progression de 35% en phase 2",
        summary: "Résultats préliminaires encourageants du laboratoire BioArctic. La phase 3 impliquera 8 000 patients.",
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
        summary: "Magasin physique, e-commerce et réseaux sociaux s'intègrent dans un parcours client sans couture. +28% de conversion.",
        source: "FEVAD",
      },
      {
        tagClass: "email-tag-ai",
        tagLabel: "IA retail",
        title: "TikTok Shop capte 28% des achats impulsifs chez les 18-34 ans",
        summary: "Le social commerce dépasse Amazon sur ce segment. Les marques réallouent leurs budgets digitaux.",
        source: "FEVAD",
      },
      {
        tagClass: "email-tag-comp",
        tagLabel: "Logistique",
        title: "Crise du dernier kilomètre : les coûts logistiques en hausse de 22%",
        summary: "Nouvelles ZFE et hausse du carburant complexifient les livraisons urbaines.",
        source: "L'Usine Nouvelle",
      },
      {
        tagClass: "email-tag-reg",
        tagLabel: "Tendances",
        title: "67% des Français intègrent l'impact environnemental dans leurs achats",
        summary: "La durabilité dépasse le prix comme critère d'achat sur le segment supérieur à 50€.",
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
        summary: "Les jumeaux numériques réduisent les arrêts de production de 25%. Retour sur investissement moyen en moins d'un an.",
        source: "Siemens",
      },
      {
        tagClass: "email-tag-ai",
        tagLabel: "Robotique",
        title: "Airbus accélère : 3 000 robots supplémentaires dans ses lignes d'assemblage",
        summary: "Investissement de 2Md€. La reconversion de 1 800 opérateurs vers la maintenance robotique est amorcée.",
        source: "Airbus IR",
      },
      {
        tagClass: "email-tag-comp",
        tagLabel: "Supply chain",
        title: "Semi-conducteurs : 12 mois d'attente pour certaines puces spécialisées",
        summary: "Les constructeurs automobiles ajustent leurs plans. L'UE accélère le Chips Act avec 43Md€ d'investissements.",
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
        summary: "Agents autonomes, IA multimodale, edge computing, souveraineté et gouvernance des données — analyse McKinsey.",
        source: "McKinsey",
      },
      {
        tagClass: "email-tag-ai",
        tagLabel: "Travail",
        title: "3 jours bureau / 2 jours remote devient la norme dans les grandes entreprises",
        summary: "74% des cadres en mode hybride selon le baromètre Malakoff Humanis 2026.",
        source: "Malakoff Humanis",
      },
      {
        tagClass: "email-tag-comp",
        tagLabel: "Cybersécurité",
        title: "Ransomware : +45% d'attaques sur les PME françaises",
        summary: "12% seulement sont assurées. L'ANSSI publie un guide de résilience.",
        source: "ANSSI",
      },
      {
        tagClass: "email-tag-reg",
        tagLabel: "Écosystème",
        title: "Record : 8,3Md€ levés par les start-up françaises au T1 2026",
        summary: "La French Tech résiste malgré le contexte macro. IA, deeptech et greentech captent 60% des montants.",
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
        borderRadius: 12,
        overflow: "hidden",
        fontFamily: "var(--font-inter, 'Inter', sans-serif)",
        fontSize: "0.8125rem",
      }}
    >
      {/* Email header */}
      <div
        style={{
          background: "var(--surface-alt)",
          borderBottom: "1px solid var(--border)",
          padding: "12px 20px",
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

      <div style={{ padding: "24px 24px" }}>
        {/* Sender row */}
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
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontWeight: 700, fontSize: "0.9375rem", letterSpacing: "-0.02em", color: "var(--text)" }}>
              Sorel<span style={{ color: "var(--accent)" }}>l</span>
            </span>
          </div>
          <span style={{ fontSize: "0.6875rem", color: "var(--text-muted)" }}>17 mars 2026 · 8h00</span>
        </div>

        <p style={{ fontWeight: 600, fontSize: "0.9375rem", color: "var(--text)", marginBottom: 4, letterSpacing: "-0.01em" }}>
          Bonjour,
        </p>
        <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", marginBottom: 16, lineHeight: 1.55 }}>
          <span style={{ fontWeight: 600, color: "var(--text)" }}>{data.articles.length} actualités clés</span>{" "}
          sélectionnées cette semaine pour {displayCompany}.
        </p>

        <div style={{ height: 1, background: "var(--border)", marginBottom: 16 }} />

        {/* Articles */}
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {data.articles.map((article, i) => (
            <div key={i}>
              {i > 0 && (
                <div style={{ height: 1, background: "var(--border)", margin: "14px 0" }} />
              )}
              {article.featured ? (
                <div style={{ marginBottom: 0 }}>
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
                      ARTICLE PHARE
                    </span>
                    <span className={`email-tag ${article.tagClass}`}>{article.tagLabel}</span>
                  </div>
                  <p style={{ fontWeight: 600, fontSize: "0.9375rem", color: "var(--text)", lineHeight: 1.35, marginBottom: 6, letterSpacing: "-0.01em" }}>
                    {article.title}
                  </p>
                  <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", lineHeight: 1.55, marginBottom: 6 }}>
                    {article.summary}
                  </p>
                  <span style={{ fontSize: "0.6875rem", color: "var(--text-muted)" }}>
                    Source : {article.source} ↗
                  </span>
                </div>
              ) : (
                <div>
                  <div style={{ marginBottom: 5 }}>
                    <span className={`email-tag ${article.tagClass}`}>{article.tagLabel}</span>
                  </div>
                  <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text)", lineHeight: 1.35, marginBottom: 4, letterSpacing: "-0.01em" }}>
                    {article.title}
                  </p>
                  <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", lineHeight: 1.5, marginBottom: 4 }}>
                    {article.summary}
                  </p>
                  <span style={{ fontSize: "0.6875rem", color: "var(--text-muted)" }}>
                    Source : {article.source} ↗
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>

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
    <div style={{ maxWidth: 680, margin: "0 auto" }}>
      {/* Config form */}
      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: 12,
          padding: "32px",
          marginBottom: 24,
        }}
      >
        <h2
          style={{
            fontFamily: "var(--font-inter, 'Inter', sans-serif)",
            fontSize: "1.125rem",
            fontWeight: 600,
            color: "var(--text)",
            marginBottom: 6,
            letterSpacing: "-0.02em",
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
              placeholder="ex : Acme Corp, NovaTech..."
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
              fontWeight: 500,
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
              "Générer ma newsletter →"
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
            borderRadius: 12,
            marginBottom: 24,
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: "50%",
              margin: "0 auto 20px",
              position: "relative",
            }}
          >
            <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "2px solid var(--border)" }} />
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
          </div>
          <p style={{ fontWeight: 600, color: "var(--text)", fontSize: "0.9375rem", marginBottom: 6, letterSpacing: "-0.01em" }}>
            {LOADING_MESSAGES[msgIdx]}
          </p>
          <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", marginBottom: 20 }}>
            Analyse de centaines de sources en temps réel
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: 4 }}>
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
        <div>
          <DemoNewsletterResult data={result} sector={currentSector} companyName={companyName} />

          {/* Post-result CTA */}
          <div
            style={{
              marginTop: 20,
              padding: "28px 32px",
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 12,
              textAlign: "center",
            }}
          >
            {!showWaitlist ? (
              <>
                <p style={{ fontWeight: 600, fontSize: "1rem", color: "var(--text)", marginBottom: 6, letterSpacing: "-0.01em" }}>
                  Vous aimez ce que vous voyez ?
                </p>
                <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginBottom: 20 }}>
                  Recevez ce briefing chaque semaine, personnalisé pour votre équipe.
                </p>
                <button
                  onClick={() => setShowWaitlist(true)}
                  className="btn-primary"
                  style={{ padding: "11px 28px", fontSize: "0.9375rem" }}
                >
                  Recevoir cette newsletter chaque semaine →
                </button>
              </>
            ) : (
              <>
                <p style={{ fontWeight: 600, color: "var(--text)", fontSize: "1rem", marginBottom: 6, letterSpacing: "-0.01em" }}>
                  Rejoindre la waitlist
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
