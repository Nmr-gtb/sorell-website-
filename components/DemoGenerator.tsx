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
      { featured: true, tagClass: "email-tag-ai", tagLabel: "IA générative", title: "Claude 4.5 dépasse GPT-4o sur les benchmarks de raisonnement complexe", summary: "Anthropic publie des résultats montrant une supériorité sur 7 benchmarks clés. Les entreprises tech réévaluent leurs intégrations LLM en conséquence.", source: "The Verge" },
      { tagClass: "email-tag-reg", tagLabel: "Réglementation", title: "L'EU AI Act entre en vigueur : ce que ça change pour les entreprises françaises", summary: "Les obligations de transparence et d'audit s'appliquent dès ce trimestre. Un guide de conformité est disponible.", source: "Legifrance" },
      { tagClass: "email-tag-fund", tagLabel: "Financement", title: "Mistral AI lève 600M€ en Série C pour accélérer son déploiement européen", summary: "La licorne française valorisée à 6Md€ accélère son expansion et ouvre un bureau à Berlin.", source: "Les Echos" },
      { tagClass: "email-tag-agents", tagLabel: "Agents IA", title: "Les agents IA autonomes entrent en production dans 3 ETI françaises pionnières", summary: "Support client, analyse juridique et code review — retours d'expérience concrets et chiffrés.", source: "MIT Technology Review" },
      { tagClass: "email-tag-dev", tagLabel: "Dev tools", title: "GitHub Copilot Workspace génère des PR complètes en langage naturel", summary: "La productivité des développeurs augmente de 40% selon une étude interne GitHub.", source: "GitHub Blog" },
    ],
  },
  "finance": {
    tag: "Veille Finance & Marchés",
    articles: [
      { featured: true, tagClass: "email-tag-reg", tagLabel: "Politique monétaire", title: "La BCE maintient ses taux à 2,5% malgré la pression inflationniste", summary: "Christine Lagarde signale une possible baisse au T3 2026. Les marchés obligataires réagissent positivement à l'annonce.", source: "BCE" },
      { tagClass: "email-tag-fund", tagLabel: "Fintech", title: "Revolut obtient sa licence bancaire française : l'impact sur les banques traditionnelles", summary: "Avec 3,2M de clients en France, Revolut peut désormais proposer des crédits immobiliers.", source: "Les Echos" },
      { tagClass: "email-tag-reg", tagLabel: "Crypto", title: "MiCA : le cadre européen des crypto-actifs pleinement opérationnel", summary: "Les exchanges doivent obtenir l'agrément PSAN+ avant juin 2026. Binance et Coinbase ont soumis leurs dossiers.", source: "AMF" },
      { tagClass: "email-tag-comp", tagLabel: "Marchés émergents", title: "L'Asie du Sud-Est attire les capitaux européens : +18% d'IDE au premier trimestre", summary: "Vietnam et Indonésie en tête. Les fonds alternatifs multiplient leurs positions dans la région.", source: "Financial Times" },
      { tagClass: "email-tag-other", tagLabel: "Cybersécurité", title: "Fraude bancaire en ligne : 1,2Md€ de pertes en France en 2025", summary: "Le phishing IA-assisté représente 43% des cas. Les banques accélèrent leurs investissements en détection.", source: "ACPR" },
    ],
  },
  "sante": {
    tag: "Veille Santé & Biotech",
    articles: [
      { featured: true, tagClass: "email-tag-ai", tagLabel: "IA médicale", title: "L'IA médicale diagnostique les cancers du sein avec 94% de précision", summary: "Une étude publiée dans The Lancet valide l'utilisation clinique de l'outil DeepMind. 12 hôpitaux français pilotes.", source: "The Lancet" },
      { tagClass: "email-tag-fund", tagLabel: "Biotech", title: "Moderna lance un essai clinique pour un vaccin ARNm contre la grippe universelle", summary: "Phase 3 sur 25 000 patients. Résultats attendus fin 2026. Un succès changerait radicalement la vaccination.", source: "Moderna IR" },
      { tagClass: "email-tag-reg", tagLabel: "Réglementation", title: "Réforme du remboursement des dispositifs médicaux connectés en France", summary: "La HAS publie une nouvelle grille d'évaluation. Les startups healthtech doivent revoir leurs dossiers.", source: "HAS" },
      { tagClass: "email-tag-fund", tagLabel: "R&D pharma", title: "Alzheimer : nouvelle molécule réduit la progression de 35% en phase 2", summary: "Résultats préliminaires encourageants du laboratoire BioArctic. La phase 3 débute au Q4 2026.", source: "NEJM" },
      { tagClass: "email-tag-other", tagLabel: "Santé publique", title: "Déserts médicaux : les téléconsultations augmentent de 62% en zone rurale", summary: "Le gouvernement annonce 2 000 postes de médecins salariés. Les plateformes de télémédicine en forte croissance.", source: "DREES" },
    ],
  },
  "retail": {
    tag: "Veille Retail & Commerce",
    articles: [
      { featured: true, tagClass: "email-tag-comp", tagLabel: "E-commerce", title: "TikTok Shop dépasse Amazon chez les 18-34 ans pour les achats impulsifs", summary: "TikTok Shop capte 28% des achats impulsifs en France. Les marques revoient leur stratégie social media.", source: "FEVAD" },
      { tagClass: "email-tag-ai", tagLabel: "IA retail", title: "Leclerc déploie des caisses à reconnaissance visuelle dans 12 hypermarchés", summary: "Réduction de 60% des temps d'attente. Les syndicats demandent des garanties sur l'emploi.", source: "LSA" },
      { tagClass: "email-tag-other", tagLabel: "Supply chain", title: "Crise du dernier kilomètre : les coûts logistiques en hausse de 22% en 18 mois", summary: "Nouvelles ZFE et hausse du carburant compliquent les livraisons urbaines. La mutualisation s'accélère.", source: "L'Usine Nouvelle" },
      { tagClass: "email-tag-comp", tagLabel: "Tendances", title: "67% des Français intègrent l'impact environnemental dans leurs achats supérieurs à 50€", summary: "Étude OpinionWay. La durabilité dépasse le prix comme critère d'achat sur le segment supérieur.", source: "OpinionWay" },
      { tagClass: "email-tag-fund", tagLabel: "Stratégie", title: "Zalando ferme 3 entrepôts et mise sur un modèle marketplace asset-light", summary: "Zalando vise 50% de GMV via des vendeurs tiers d'ici 2027. Réduction des coûts fixes significative.", source: "Zalando IR" },
    ],
  },
  "industrie": {
    tag: "Veille Industrie & Énergie",
    articles: [
      { featured: true, tagClass: "email-tag-ai", tagLabel: "Industrie 4.0", title: "Les jumeaux numériques réduisent les arrêts de production de 25% selon Siemens", summary: "Rapport sur 150 usines déployant des digital twins. Le ROI moyen est atteint en 8 mois.", source: "Siemens" },
      { tagClass: "email-tag-agents", tagLabel: "Automatisation", title: "Airbus accélère : 3 000 robots supplémentaires dans ses lignes d'assemblage d'ici 2027", summary: "Investissement de 2Md€. Reconversion de 1 800 opérateurs vers la maintenance robotique.", source: "Airbus IR" },
      { tagClass: "email-tag-fund", tagLabel: "Transition énergie", title: "La France atteint 40% d'énergie renouvelable dans le mix électrique", summary: "Record historique porté par l'éolien offshore breton. RTE prévoit 55% de renouvelables en 2028.", source: "RTE" },
      { tagClass: "email-tag-other", tagLabel: "Supply chain", title: "Semi-conducteurs : 12 mois d'attente pour certaines puces spécialisées", summary: "Les constructeurs automobiles ajustent leurs plans de production. L'UE accélère le Chips Act.", source: "Bloomberg" },
      { tagClass: "email-tag-fund", tagLabel: "Décarbonation", title: "Première station hydrogène vert industrielle ouvre à Dunkerque", summary: "Le port de Dunkerque décarbone sa flotte de portiques. Coût de production : 4€/kg.", source: "L'Usine Nouvelle" },
    ],
  },
  "autre": {
    tag: "Veille Générale",
    articles: [
      { featured: true, tagClass: "email-tag-ai", tagLabel: "IA & Entreprise", title: "Les 5 tendances IA qui vont transformer les entreprises françaises en 2026", summary: "Agents autonomes, IA multimodale, edge computing, souveraineté et gouvernance des données — analyse complète.", source: "McKinsey" },
      { tagClass: "email-tag-other", tagLabel: "Travail", title: "3 jours bureau / 2 jours remote devient la norme : 74% des cadres en hybride", summary: "Baromètre Malakoff Humanis 2026. Les espaces de coworking en forte croissance dans les villes moyennes.", source: "Malakoff Humanis" },
      { tagClass: "email-tag-comp", tagLabel: "Cybersécurité", title: "Ransomware : +45% d'attaques sur les PME françaises, 12% seulement assurées", summary: "L'ANSSI publie un guide de résilience. Les PME sous-estiment encore leur exposition.", source: "ANSSI" },
      { tagClass: "email-tag-reg", tagLabel: "ESG", title: "CSRD : 50 000 entreprises françaises doivent publier leur bilan carbone", summary: "Entrée en vigueur progressive jusqu'en 2026. Les cabinets ESG font face à une explosion de la demande.", source: "EFRAG" },
      { tagClass: "email-tag-fund", tagLabel: "Écosystème", title: "Record : 8,3Md€ levés par les start-up françaises au T1 2026", summary: "La French Tech résiste. IA, deeptech et greentech captent 60% des montants levés.", source: "France Digitale" },
    ],
  },
};

const LOADING_MESSAGES = [
  "Analyse des sources en temps réel...",
  "Sélection des articles pertinents...",
  "Vérification de la fiabilité des sources...",
  "Rédaction des synthèses IA...",
  "Personnalisation selon votre profil...",
  "Finalisation de votre briefing...",
];

function RichNewsletterResult({ data, sector }: { data: SectorData; sector: string }) {
  const sectorLabels: Record<string, string> = {
    "tech-ia": "Tech / IA", finance: "Finance", sante: "Santé",
    retail: "Retail", industrie: "Industrie", autre: "Général",
  };

  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 18,
        overflow: "hidden",
        boxShadow: "var(--shadow-xl)",
      }}
    >
      {/* Email chrome */}
      <div
        style={{
          background: "var(--surface-alt)",
          borderBottom: "1px solid var(--border)",
          padding: "10px 18px",
          display: "flex",
          flexDirection: "column",
          gap: 6,
        }}
      >
        <div style={{ display: "flex", gap: 6 }}>
          {["#FF5F57", "#FEBC2E", "#28C840"].map((c) => (
            <div key={c} style={{ width: 11, height: 11, borderRadius: "50%", background: c }} />
          ))}
        </div>
        <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", display: "grid", gap: 2 }}>
          <span>
            <span style={{ color: "var(--text-muted)", marginRight: 4 }}>De :</span>
            <span style={{ fontWeight: 500, color: "var(--text)" }}>Sorell</span>
            <span style={{ color: "var(--text-muted)" }}> &lt;veille@sorell.fr&gt;</span>
          </span>
          <span>
            <span style={{ color: "var(--text-muted)", marginRight: 4 }}>Objet :</span>
            <span style={{ fontWeight: 500, color: "var(--text)" }}>
              Votre briefing du lundi 17 mars 2026 · {sectorLabels[sector] || "Général"}
            </span>
          </span>
        </div>
      </div>

      <div style={{ padding: "22px 24px" }}>
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
                width: 30, height: 30, borderRadius: "50%",
                background: "var(--accent)", display: "flex",
                alignItems: "center", justifyContent: "center",
                fontFamily: "var(--font-playfair, serif)",
                fontWeight: 600, fontSize: "0.875rem", color: "white", flexShrink: 0,
              }}
            >
              S
            </div>
            <div>
              <div style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--text)", lineHeight: 1.2 }}>Sorell</div>
              <div style={{ fontSize: "0.6875rem", color: "var(--text-muted)" }}>17 mars 2026 · 8h00</div>
            </div>
          </div>
          <span className="email-tag email-tag-ai" style={{ fontSize: "0.6875rem" }}>
            {data.tag}
          </span>
        </div>

        <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", marginBottom: 18, lineHeight: 1.5 }}>
          Bonjour,{" "}
          <span style={{ color: "var(--text)", fontWeight: 500 }}>{data.articles.length} tendances clés</span>{" "}
          sélectionnées cette semaine dans votre secteur.
        </p>

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
                    padding: "14px 16px",
                    background: "var(--surface-alt)",
                    borderRadius: 10,
                    border: "1px solid var(--border-subtle)",
                    marginBottom: 12,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8, flexWrap: "wrap" }}>
                    <span
                      className="font-mono"
                      style={{
                        fontSize: "0.6rem",
                        fontWeight: 700,
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        color: "var(--accent)",
                      }}
                    >
                      ★ Article phare
                    </span>
                    <span className={`email-tag ${article.tagClass}`}>{article.tagLabel}</span>
                  </div>
                  <p
                    className="font-display"
                    style={{ fontSize: "0.9375rem", fontWeight: 600, color: "var(--text)", lineHeight: 1.35, marginBottom: 6 }}
                  >
                    {article.title}
                  </p>
                  <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", lineHeight: 1.55, marginBottom: 8 }}>
                    {article.summary}
                  </p>
                  <span className="font-mono" style={{ fontSize: "0.6875rem", color: "var(--text-muted)" }}>
                    Source : {article.source} ↗
                  </span>
                </div>
              ) : (
                <div style={{ display: "flex", gap: 10 }}>
                  <span
                    className="font-mono"
                    style={{ fontSize: "0.6875rem", fontWeight: 600, color: "var(--accent)", flexShrink: 0, width: 20, marginTop: 2 }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5, flexWrap: "wrap" }}>
                      <span className={`email-tag ${article.tagClass}`}>{article.tagLabel}</span>
                    </div>
                    <p style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--text)", lineHeight: 1.35, marginBottom: 4 }}>
                      {article.title}
                    </p>
                    <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", lineHeight: 1.5, marginBottom: 4 }}>
                      {article.summary}
                    </p>
                    <span className="font-mono" style={{ fontSize: "0.6875rem", color: "var(--text-muted)" }}>
                      Source : {article.source} ↗
                    </span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Email footer */}
        <div
          style={{
            marginTop: 18,
            paddingTop: 14,
            borderTop: "1px solid var(--border-subtle)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 8,
          }}
        >
          <span className="font-mono" style={{ fontSize: "0.6875rem", color: "var(--text-muted)" }}>
            Généré par Sorell IA · sorell.fr
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
            Lire tous les articles →
          </button>
        </div>
      </div>
    </div>
  );
}

export default function DemoGenerator() {
  const [sector, setSector] = useState("");
  const [topics, setTopics] = useState("");
  const [companies, setCompanies] = useState("");
  const [loading, setLoading] = useState(false);
  const [msgIdx, setMsgIdx] = useState(0);
  const [result, setResult] = useState<SectorData | null>(null);
  const [showWaitlist, setShowWaitlist] = useState(false);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sector) return;
    setLoading(true);
    setResult(null);
    setShowWaitlist(false);
    let idx = 0;
    setMsgIdx(0);
    const interval = setInterval(() => {
      idx = (idx + 1) % LOADING_MESSAGES.length;
      setMsgIdx(idx);
    }, 900);
    await new Promise((r) => setTimeout(r, 3600));
    clearInterval(interval);
    setResult(SECTOR_CONTENT[sector] || SECTOR_CONTENT["autre"]);
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: 760, margin: "0 auto" }}>
      {/* Config form */}
      <div
        className="card"
        style={{ padding: "32px", marginBottom: 32 }}
      >
        <h2
          className="font-display"
          style={{ fontSize: "1.375rem", fontWeight: 600, color: "var(--text)", marginBottom: 6 }}
        >
          Configurez votre newsletter
        </h2>
        <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginBottom: 28 }}>
          Remplissez les champs ci-dessous et notre IA génère un aperçu en quelques secondes.
        </p>

        <form onSubmit={handleGenerate} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Sector */}
          <div>
            <label
              style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, color: "var(--text)", marginBottom: 8 }}
            >
              Votre secteur d&apos;activité{" "}
              <span style={{ color: "var(--accent)" }}>*</span>
            </label>
            <div style={{ position: "relative" }}>
              <select
                value={sector}
                onChange={(e) => setSector(e.target.value)}
                required
                className="select-field"
                style={{ width: "100%", padding: "10px 40px 10px 14px", fontSize: "0.875rem" }}
              >
                <option value="" disabled>Choisissez votre secteur...</option>
                <option value="tech-ia">Tech / IA</option>
                <option value="finance">Finance</option>
                <option value="sante">Santé</option>
                <option value="retail">Retail</option>
                <option value="industrie">Industrie</option>
                <option value="autre">Autre</option>
              </select>
              <svg
                width="14" height="14" viewBox="0 0 16 16" fill="none"
                style={{
                  position: "absolute", right: 12, top: "50%",
                  transform: "translateY(-50%)", pointerEvents: "none",
                  color: "var(--text-muted)",
                }}
              >
                <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
          </div>

          {/* Topics */}
          <div>
            <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, color: "var(--text)", marginBottom: 8 }}>
              Sujets qui vous intéressent
            </label>
            <input
              type="text"
              value={topics}
              onChange={(e) => setTopics(e.target.value)}
              placeholder="ex: IA générative, réglementation, levées de fonds, concurrents..."
              className="input-field"
              style={{ padding: "10px 14px", fontSize: "0.875rem" }}
            />
          </div>

          {/* Companies */}
          <div>
            <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 500, color: "var(--text)", marginBottom: 8 }}>
              Entreprises à surveiller{" "}
              <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>(optionnel)</span>
            </label>
            <input
              type="text"
              value={companies}
              onChange={(e) => setCompanies(e.target.value)}
              placeholder="ex: Mistral AI, OpenAI, votre concurrent principal..."
              className="input-field"
              style={{ padding: "10px 14px", fontSize: "0.875rem" }}
            />
          </div>

          <button
            type="submit"
            disabled={!sector || loading}
            className="btn-accent"
            style={{
              padding: "13px",
              fontSize: "0.9375rem",
              fontWeight: 600,
              opacity: !sector ? 0.5 : 1,
              cursor: !sector ? "not-allowed" : "pointer",
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

      {/* Loading */}
      {loading && (
        <div
          style={{
            padding: "40px 32px",
            textAlign: "center",
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: 16,
            marginBottom: 32,
          }}
        >
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: "50%",
              margin: "0 auto 16px",
              position: "relative",
            }}
          >
            <div
              style={{
                position: "absolute", inset: 0,
                borderRadius: "50%",
                border: "2px solid var(--border)",
              }}
            />
            <div
              className="animate-spin"
              style={{
                position: "absolute", inset: 0,
                borderRadius: "50%",
                border: "2px solid transparent",
                borderTopColor: "var(--accent)",
              }}
            />
            <div
              style={{
                position: "absolute", inset: "10px",
                borderRadius: "50%",
                background: "var(--accent-subtle)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "1.125rem",
              }}
            >
              ✦
            </div>
          </div>
          <p style={{ fontWeight: 600, color: "var(--text)", fontSize: "0.9375rem", marginBottom: 4 }}>
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
        <div className="animate-fade-up">
          <RichNewsletterResult data={result} sector={sector} />

          {/* CTA */}
          <div
            style={{
              marginTop: 24,
              padding: "28px",
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 16,
              textAlign: "center",
            }}
          >
            {!showWaitlist ? (
              <>
                <p style={{ fontWeight: 600, color: "var(--text)", fontSize: "1rem", marginBottom: 6 }}>
                  Vous aimez ce que vous voyez ?
                </p>
                <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginBottom: 20 }}>
                  Recevez cette newsletter chaque semaine, personnalisée pour votre équipe.
                </p>
                <button
                  onClick={() => setShowWaitlist(true)}
                  className="btn-accent"
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
