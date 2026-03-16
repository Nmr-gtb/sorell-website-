"use client";

import { useState } from "react";
import WaitlistForm from "./WaitlistForm";

const SECTOR_CONTENT: Record<string, { tag: string; articles: { title: string; tag: string; impact: string; impactColor: string; summary: string }[] }> = {
  "tech-ia": {
    tag: "Veille IA & Tech",
    articles: [
      { title: "Claude 4.5 dépasse GPT-4o sur les benchmarks de raisonnement complexe", tag: "IA générative", impact: "Élevé", impactColor: "#ef4444", summary: "Anthropic publie des résultats montrant une supériorité sur 7 benchmarks clés. Les entreprises tech réévaluent leurs intégrations LLM." },
      { title: "L'EU AI Act entre en vigueur : ce que ça change pour les entreprises françaises", tag: "Réglementation", impact: "Critique", impactColor: "#f97316", summary: "Les obligations de transparence et d'audit s'appliquent dès janvier 2026. Un guide pratique de conformité est disponible." },
      { title: "Mistral AI lève 600M€ en Série C pour son déploiement européen", tag: "Financement", impact: "Modéré", impactColor: "#10b981", summary: "La licorne française valorisée à 6Md€ accélère son expansion en entreprise et ouvre un bureau à Berlin." },
      { title: "Les agents IA autonomes entrent en production dans 3 cas concrets", tag: "Agents IA", impact: "Élevé", impactColor: "#ef4444", summary: "Support client, analyse juridique et code review — retours d'expérience de trois ETI françaises pionnières." },
      { title: "GitHub Copilot Workspace génère des PR complètes en langage naturel", tag: "Dev tools", impact: "Modéré", impactColor: "#10b981", summary: "La productivité des développeurs augmente de 40% selon une étude interne. Disponible en beta pour les équipes Enterprise." },
    ],
  },
  "finance": {
    tag: "Veille Finance & Marchés",
    articles: [
      { title: "La BCE maintient ses taux directeurs à 2,5% malgré la pression inflationniste", tag: "Politique monétaire", impact: "Critique", impactColor: "#f97316", summary: "Christine Lagarde signale une possible baisse au T3 2026. Les marchés obligataires réagissent positivement." },
      { title: "Revolut obtient sa licence bancaire française : l'impact sur les banques traditionnelles", tag: "Fintech", impact: "Élevé", impactColor: "#ef4444", summary: "Avec 3,2M de clients en France, Revolut peut désormais proposer des crédits immobiliers. Les banques en ligne accélèrent leur réponse." },
      { title: "MiCA : le cadre européen des crypto-actifs pleinement opérationnel", tag: "Régulation crypto", impact: "Élevé", impactColor: "#ef4444", summary: "Les exchanges doivent obtenir l'agrément PSAN+ avant juin 2026. Binance et Coinbase ont déjà soumis leurs dossiers." },
      { title: "Les marchés émergents en Asie du Sud-Est attirent les capitaux européens", tag: "Marchés", impact: "Modéré", impactColor: "#10b981", summary: "Vietnam et Indonésie enregistrent +18% d'IDE européens. Les fonds alternatifs multiplient leurs positions dans la région." },
      { title: "Fraude bancaire en ligne : les pertes atteignent 1,2Md€ en France en 2025", tag: "Cybersécurité", impact: "Élevé", impactColor: "#ef4444", summary: "Le phishing IA-assisté représente 43% des cas. Les banques investissent massivement dans la détection comportementale." },
    ],
  },
  "sante": {
    tag: "Veille Santé & Biotech",
    articles: [
      { title: "L'IA médicale diagnostique les cancers du sein avec 94% de précision", tag: "IA médicale", impact: "Critique", impactColor: "#f97316", summary: "Une étude publiée dans The Lancet valide l'utilisation clinique de l'outil DeepMind en radiologie. 12 hôpitaux français pilotes." },
      { title: "Moderna lance un essai clinique pour un vaccin ARNm contre la grippe universelle", tag: "Biotech", impact: "Élevé", impactColor: "#ef4444", summary: "Phase 3 sur 25 000 patients. Résultats attendus fin 2026. Un succès pourrait changer radicalement la vaccination saisonnière." },
      { title: "Réforme du remboursement des dispositifs médicaux connectés en France", tag: "Réglementation", impact: "Élevé", impactColor: "#ef4444", summary: "La HAS publie une nouvelle grille d'évaluation. Les startups healthtech doivent revoir leurs dossiers de prise en charge." },
      { title: "Alzheimer : nouvelle molécule réduit la progression de 35% en essai de phase 2", tag: "R&D pharma", impact: "Modéré", impactColor: "#10b981", summary: "Résultats préliminaires encourageants du laboratoire suédois BioArctic. La phase 3 débutera au Q4 2026." },
      { title: "Pénurie de médecins généralistes : les déserts médicaux couvrent 30% du territoire", tag: "Santé publique", impact: "Critique", impactColor: "#f97316", summary: "Le gouvernement annonce 2 000 postes de médecins salariés en zones sous-dotées. Les téléconsultations en forte hausse." },
    ],
  },
  "retail": {
    tag: "Veille Retail & Commerce",
    articles: [
      { title: "Le commerce social explose : TikTok Shop dépasse Amazon chez les 18-34 ans", tag: "E-commerce", impact: "Élevé", impactColor: "#ef4444", summary: "TikTok Shop capte 28% des achats impulsifs en France. Les marques revoient leur stratégie social media en urgence." },
      { title: "IA en point de vente : Leclerc déploie des caisses à reconnaissance visuelle", tag: "IA retail", impact: "Modéré", impactColor: "#10b981", summary: "Pilote dans 12 hyperMarchés. Réduction de 60% des temps d'attente. Les syndicats demandent des garanties sur l'emploi." },
      { title: "Crise du dernier kilomètre : les coûts logistiques +22% en 18 mois", tag: "Supply chain", impact: "Critique", impactColor: "#f97316", summary: "Hausse du prix du carburant et nouvelles ZFE compliquent les livraisons urbaines. Les acteurs testent la mutualisation." },
      { title: "Le consommateur français privilégie la durabilité sur le prix pour les achats >50€", tag: "Tendances", impact: "Élevé", impactColor: "#ef4444", summary: "Étude OpinionWay : 67% des Français déclarent intégrer l'impact environnemental dans leurs achats significatifs." },
      { title: "Zalando ferme 3 entrepôts en Europe et mise sur la marketplace", tag: "Stratégie", impact: "Modéré", impactColor: "#10b981", summary: "Pivot vers un modèle asset-light. Zalando vise 50% de GMV via des vendeurs tiers d'ici 2027." },
    ],
  },
  "industrie": {
    tag: "Veille Industrie & Énergie",
    articles: [
      { title: "Industrie 4.0 : les jumeaux numériques réduisent les arrêts de production de 25%", tag: "Industrie 4.0", impact: "Élevé", impactColor: "#ef4444", summary: "Siemens publie un rapport sur 150 usines déployant des digital twins. Le ROI moyen est de 8 mois." },
      { title: "Airbus accélère l'automatisation : 3 000 robots supplémentaires d'ici 2027", tag: "Automatisation", impact: "Élevé", impactColor: "#ef4444", summary: "Investissement de 2Md€ dans les lignes d'assemblage. Reconversion de 1 800 opérateurs vers la maintenance robotique." },
      { title: "La France atteint 40% d'énergie renouvelable dans le mix électrique", tag: "Transition énergie", impact: "Modéré", impactColor: "#10b981", summary: "Record historique porté par l'éolien offshore breton. RTE prévoit 55% de renouvelables d'ici 2028." },
      { title: "Pénurie de composants semi-conducteurs : 12 mois d'attente pour certaines puces", tag: "Supply chain", impact: "Critique", impactColor: "#f97316", summary: "Les constructeurs automobiles et industriels ajustent leurs plans de production. L'UE accélère le Chips Act européen." },
      { title: "Hydrogène vert : première station de recharge industrielle ouvre à Dunkerque", tag: "Décarbonation", impact: "Modéré", impactColor: "#10b981", summary: "Le port de Dunkerque mise sur l'hydrogène pour décarboner sa flotte de portiques. Coût de production : 4€/kg." },
    ],
  },
  "autre": {
    tag: "Veille Générale",
    articles: [
      { title: "Intelligence artificielle : les 5 tendances qui vont transformer les entreprises en 2026", tag: "IA", impact: "Élevé", impactColor: "#ef4444", summary: "Agents autonomes, IA multimodale, edge computing, souveraineté et gouvernance des données — analyse complète." },
      { title: "Le télétravail hybride s'ancre : 3 jours bureau / 2 jours remote devient la norme", tag: "Travail", impact: "Modéré", impactColor: "#10b981", summary: "Baromètre Malakoff Humanis 2026 : 74% des cadres en hybride. Les espaces de coworking en forte croissance." },
      { title: "Cybersécurité : les attaques par ransomware en hausse de 45% sur les PME françaises", tag: "Cyber", impact: "Critique", impactColor: "#f97316", summary: "L'ANSSI publie un guide de résilience. Les PME sous-estiment encore leur exposition avec seulement 12% assurées." },
      { title: "ESG : la directive CSRD oblige 50 000 entreprises à publier leur bilan carbone", tag: "Réglementation", impact: "Élevé", impactColor: "#ef4444", summary: "Entrée en vigueur progressive jusqu'en 2026. Les cabinets de conseil ESG font face à une explosion de la demande." },
      { title: "Start-up françaises : un record de 8,3Md€ levés au premier trimestre 2026", tag: "Écosystème", impact: "Modéré", impactColor: "#10b981", summary: "La French Tech résiste aux turbulences mondiales. IA, deeptech et greentech captent 60% des montants." },
    ],
  },
};

const LOADING_MESSAGES = [
  "Analyse des sources en temps réel...",
  "Sélection des articles les plus pertinents...",
  "Vérification de la fiabilité des sources...",
  "Rédaction des synthèses IA...",
  "Personnalisation selon votre profil...",
  "Finalisation de votre briefing...",
];

export default function DemoGenerator() {
  const [sector, setSector] = useState("");
  const [topics, setTopics] = useState("");
  const [companies, setCompanies] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState(0);
  const [result, setResult] = useState<typeof SECTOR_CONTENT[string] | null>(null);
  const [showWaitlist, setShowWaitlist] = useState(false);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sector) return;

    setLoading(true);
    setResult(null);
    setShowWaitlist(false);

    let msgIdx = 0;
    setLoadingMessage(0);
    const interval = setInterval(() => {
      msgIdx = (msgIdx + 1) % LOADING_MESSAGES.length;
      setLoadingMessage(msgIdx);
    }, 900);

    await new Promise((r) => setTimeout(r, 3500));
    clearInterval(interval);

    setResult(SECTOR_CONTENT[sector] || SECTOR_CONTENT["autre"]);
    setLoading(false);
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Config form */}
      <form
        onSubmit={handleGenerate}
        className="card p-8 mb-8"
      >
        <h2 className="text-xl font-semibold mb-6" style={{ color: "#f0f0f5" }}>
          Configurez votre newsletter
        </h2>

        <div className="space-y-5">
          {/* Sector */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: "#9090aa" }}>
              Votre secteur d&apos;activité *
            </label>
            <div className="relative">
              <select
                value={sector}
                onChange={(e) => setSector(e.target.value)}
                required
                className="select-field w-full px-4 py-3 text-sm pr-10"
              >
                <option value="" disabled>
                  Choisissez votre secteur...
                </option>
                <option value="tech-ia">Tech / IA</option>
                <option value="finance">Finance</option>
                <option value="sante">Santé</option>
                <option value="retail">Retail</option>
                <option value="industrie">Industrie</option>
                <option value="autre">Autre</option>
              </select>
              <svg
                className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                viewBox="0 0 16 16"
                fill="none"
                style={{ color: "#5a5a72" }}
              >
                <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
          </div>

          {/* Topics */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: "#9090aa" }}>
              Sujets qui vous intéressent
            </label>
            <input
              type="text"
              value={topics}
              onChange={(e) => setTopics(e.target.value)}
              placeholder="ex: IA générative, concurrents, réglementation, levées de fonds..."
              className="input-field w-full px-4 py-3 text-sm"
            />
          </div>

          {/* Companies */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: "#9090aa" }}>
              Entreprises à surveiller{" "}
              <span className="font-normal" style={{ color: "#5a5a72" }}>
                (optionnel)
              </span>
            </label>
            <input
              type="text"
              value={companies}
              onChange={(e) => setCompanies(e.target.value)}
              placeholder="ex: Mistral AI, OpenAI, votre concurrent principal..."
              className="input-field w-full px-4 py-3 text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={!sector || loading}
            className="btn-accent w-full py-3.5 text-base font-semibold"
            style={{ opacity: !sector ? 0.5 : 1, cursor: !sector ? "not-allowed" : "pointer" }}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" opacity="0.25" />
                  <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                Génération en cours...
              </span>
            ) : (
              "✦ Générer ma newsletter"
            )}
          </button>
        </div>
      </form>

      {/* Loading state */}
      {loading && (
        <div
          className="card p-8 text-center"
          style={{ background: "rgba(124, 58, 237, 0.04)", borderColor: "rgba(124,58,237,0.15)" }}
        >
          <div className="flex flex-col items-center gap-4">
            <div className="relative w-16 h-16">
              <div
                className="absolute inset-0 rounded-full border-2"
                style={{ borderColor: "rgba(124,58,237,0.15)" }}
              />
              <div
                className="absolute inset-0 rounded-full border-2 border-t-transparent animate-spin"
                style={{ borderColor: "#7c3aed", borderTopColor: "transparent" }}
              />
              <div
                className="absolute inset-3 rounded-full flex items-center justify-center text-xl"
                style={{ background: "rgba(124,58,237,0.1)" }}
              >
                ✦
              </div>
            </div>
            <div>
              <p className="text-sm font-medium mb-1" style={{ color: "#f0f0f5" }}>
                {LOADING_MESSAGES[loadingMessage]}
              </p>
              <p className="text-xs" style={{ color: "#5a5a72" }}>
                Notre IA analyse des centaines de sources en temps réel
              </p>
            </div>
            <div className="flex gap-1.5 mt-2">
              {LOADING_MESSAGES.map((_, i) => (
                <div
                  key={i}
                  className="h-1 rounded-full transition-all duration-300"
                  style={{
                    width: i === loadingMessage ? "24px" : "6px",
                    background: i === loadingMessage ? "#7c3aed" : "#2a2a3a",
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Result */}
      {result && !loading && (
        <div className="animate-fade-up">
          {/* Email preview */}
          <div
            className="rounded-2xl overflow-hidden border mb-6"
            style={{
              background: "#16161f",
              borderColor: "#2a2a3a",
              boxShadow: "0 24px 64px rgba(0,0,0,0.4)",
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
                className="ml-4 text-xs px-3 py-1 rounded-md flex-1 text-center mx-8"
                style={{ background: "#16161f", color: "#5a5a72" }}
              >
                veille@sorell.fr
              </div>
            </div>

            {/* Email header */}
            <div className="px-6 pt-5 pb-4 border-b" style={{ borderColor: "#1e1e2a" }}>
              <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
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
                  className="text-xs px-2.5 py-1 rounded-full font-medium"
                  style={{
                    background: "rgba(124,58,237,0.15)",
                    color: "#a78bfa",
                    border: "1px solid rgba(124,58,237,0.25)",
                  }}
                >
                  {result.tag}
                </span>
              </div>
              <div className="text-base font-semibold mb-1" style={{ color: "#f0f0f5" }}>
                Votre briefing de la semaine — 17 mars 2026
              </div>
              <div className="text-sm" style={{ color: "#9090aa" }}>
                Personnalisé selon vos préférences
              </div>
            </div>

            {/* Articles */}
            <div className="px-6 py-5">
              <p className="text-sm mb-5" style={{ color: "#9090aa" }}>
                Bonjour, voici les{" "}
                <span className="font-semibold" style={{ color: "#f0f0f5" }}>
                  5 informations clés
                </span>{" "}
                de la semaine dans votre secteur.
              </p>

              <div className="space-y-4">
                {result.articles.map((article, i) => (
                  <div
                    key={i}
                    className="flex gap-3 p-4 rounded-xl"
                    style={{ background: "#111118" }}
                  >
                    <span
                      className="text-xs font-bold mt-0.5 flex-shrink-0 w-5"
                      style={{ color: "#7c3aed" }}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span
                          className="text-xs px-2 py-0.5 rounded-full"
                          style={{ background: "#16161f", color: "#9090aa", border: "1px solid #2a2a3a" }}
                        >
                          {article.tag}
                        </span>
                        <span className="text-xs font-medium" style={{ color: article.impactColor }}>
                          ● {article.impact}
                        </span>
                      </div>
                      <p className="text-sm font-semibold mb-1.5 leading-snug" style={{ color: "#f0f0f5" }}>
                        {article.title}
                      </p>
                      <p className="text-xs leading-relaxed" style={{ color: "#9090aa" }}>
                        {article.summary}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div
                className="mt-5 pt-4 border-t flex items-center justify-between flex-wrap gap-2"
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

          {/* CTA */}
          {!showWaitlist ? (
            <div
              className="card p-6 text-center"
              style={{
                background: "rgba(124, 58, 237, 0.04)",
                borderColor: "rgba(124,58,237,0.2)",
              }}
            >
              <p className="font-semibold mb-1" style={{ color: "#f0f0f5" }}>
                Vous aimez ce que vous voyez ?
              </p>
              <p className="text-sm mb-5" style={{ color: "#9090aa" }}>
                Recevez cette newsletter chaque semaine, personnalisée pour votre équipe.
              </p>
              <button
                onClick={() => setShowWaitlist(true)}
                className="btn-accent px-8 py-3 text-sm font-semibold"
              >
                Recevoir cette newsletter chaque semaine →
              </button>
            </div>
          ) : (
            <div
              className="card p-6"
              style={{
                background: "rgba(124, 58, 237, 0.04)",
                borderColor: "rgba(124,58,237,0.2)",
              }}
            >
              <p className="font-semibold mb-1" style={{ color: "#f0f0f5" }}>
                Rejoignez la waitlist
              </p>
              <p className="text-sm mb-4" style={{ color: "#9090aa" }}>
                Gratuit. Pas de spam. Recevez un échantillon dès votre inscription.
              </p>
              <WaitlistForm />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
