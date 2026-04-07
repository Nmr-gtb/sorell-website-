import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tarifs",
  description: "Découvrez les tarifs Sorell : plan gratuit, Pro à 19 euros/mois et Business à 49 euros/mois. Essai gratuit 15 jours, sans carte bancaire.",
  openGraph: {
    title: "Tarifs | Sorell",
    description: "Plan gratuit, Pro à 19 euros/mois, Business à 49 euros/mois. Essai gratuit 15 jours.",
    url: "https://sorell.fr/tarifs",
  },
  alternates: { canonical: "https://sorell.fr/tarifs" },
};

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Quelle est la différence avec ChatGPT ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "ChatGPT est un outil généraliste que vous devez relancer chaque semaine avec un prompt. Sorell est automatique : vous configurez une fois, et chaque semaine votre newsletter arrive toute seule dans votre boîte mail. En plus, Sorell utilise de vraies sources web (Les Echos, Bloomberg, Reuters...) avec des liens cliquables, là où ChatGPT peut inventer des informations.",
      },
    },
    {
      "@type": "Question",
      name: "Quelle est la différence avec Google Alerts ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Google Alerts vous envoie des liens bruts sans résumé - vous devez tout lire vous-même. Sorell analyse les articles, les résume et vous livre un briefing éditorial prêt à lire en 5 minutes.",
      },
    },
    {
      "@type": "Question",
      name: "Est-ce que les informations sont fiables ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Oui. Chaque article de votre newsletter est basé sur une vraie source trouvée sur le web (presse, médias spécialisés, rapports). Chaque article contient un lien direct vers la source originale pour que vous puissiez vérifier.",
      },
    },
    {
      "@type": "Question",
      name: "Le plan gratuit est-il vraiment gratuit ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Oui, sans carte bancaire et sans engagement. Vous recevez 1 newsletter par mois, entièrement personnalisée avec la recherche web IA. La première s'envoie instantanément après l'inscription.",
      },
    },
    {
      "@type": "Question",
      name: "Combien de temps faut-il pour configurer Sorell ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "5 minutes. Vous décrivez votre activité en quelques lignes, vous choisissez vos thématiques, et c'est tout. Votre première newsletter peut être générée immédiatement.",
      },
    },
    {
      "@type": "Question",
      name: "Pourquoi payer 19€/mois alors que le plan gratuit existe ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Le plan gratuit est limité à 1 destinataire et 1 newsletter par mois avec des thématiques prédéfinies. Le plan Pro offre des newsletters illimitées, jusqu'à 10 destinataires, des thématiques et sources au choix, l'historique, l'aperçu avant envoi et les analytics complets.",
      },
    },
    {
      "@type": "Question",
      name: "Mon stagiaire peut faire la même chose, non ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Un stagiaire passe en moyenne 2 à 4 heures par semaine pour compiler une veille sectorielle. Sorell le fait en 12 secondes, chaque semaine, sans oubli, sans absence, sans formation. Et le coût est de 19€/mois contre un salaire de stagiaire.",
      },
    },
    {
      "@type": "Question",
      name: "Puis-je annuler à tout moment ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Oui, en un clic depuis votre profil. Pas de préavis, pas de frais. L'accès est maintenu jusqu'à la fin de la période en cours.",
      },
    },
    {
      "@type": "Question",
      name: "Mes données sont-elles sécurisées ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Oui. Hébergement sur serveurs européens, chiffrement AES-256, conforme RGPD. Nous ne revendons jamais vos données. Les paiements sont sécurisés par Stripe.",
      },
    },
    {
      "@type": "Question",
      name: "L'IA peut-elle se tromper ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Comme tout outil, l'IA peut parfois manquer de précision. C'est pourquoi chaque article contient un lien vers la source originale - vous pouvez toujours vérifier. Le contenu ne constitue pas un conseil professionnel.",
      },
    },
    {
      "@type": "Question",
      name: "Puis-je modifier ma newsletter après l'avoir configurée ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Oui, à tout moment. Vous pouvez changer vos thématiques, vos sources, votre brief et votre fréquence d'envoi quand vous le souhaitez. Les modifications sont prises en compte dès la prochaine newsletter.",
      },
    },
    {
      "@type": "Question",
      name: "Comment fonctionne l'essai gratuit ?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Vous avez 15 jours pour tester toutes les fonctionnalités du plan choisi. Votre carte bancaire est demandée mais vous n'êtes pas débité pendant la période d'essai. Vous pouvez annuler à tout moment avant la fin des 15 jours sans aucun frais.",
      },
    },
  ],
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      {children}
    </>
  );
}
