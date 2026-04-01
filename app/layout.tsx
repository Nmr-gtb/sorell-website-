import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import ThemeProvider from "@/components/ThemeProvider";
import { AuthProvider } from "@/lib/AuthContext";
import { LanguageProvider } from "@/lib/LanguageContext";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});


export const metadata: Metadata = {
  metadataBase: new URL("https://sorell.fr"),
  title: {
    default: "Sorell - Un email par semaine. Tout ce qu'il faut savoir sur votre secteur.",
    template: "%s - Sorell",
  },
  description: "Sorell vous envoie automatiquement un résumé des actualités de votre secteur. Gratuit, sans carte bancaire, prêt en 5 minutes.",
  keywords: ["newsletter IA", "veille sectorielle", "newsletter automatique", "intelligence artificielle", "veille concurrentielle", "newsletter B2B", "newsletter personnalisée", "veille réglementaire"],
  authors: [{ name: "Sorell" }],
  creator: "Sorell",
  publisher: "Sorell",
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: "https://sorell.fr",
    siteName: "Sorell",
    title: "Sorell - Un email par semaine. Tout ce qu'il faut savoir sur votre secteur.",
    description: "Sorell vous envoie automatiquement un résumé des actualités de votre secteur. Gratuit, sans carte bancaire, prêt en 5 minutes.",
    images: [
      {
        url: "/og-image.svg",
        width: 1200,
        height: 630,
        alt: "Sorell - Newsletter IA pour les professionnels",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Sorell - Un email par semaine. Tout ce qu'il faut savoir sur votre secteur.",
    description: "Sorell vous envoie automatiquement un résumé des actualités de votre secteur. Gratuit, sans carte bancaire, prêt en 5 minutes.",
    images: ["/og-image.svg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  icons: { icon: "/icone.png" },
  alternates: {
    canonical: "https://sorell.fr",
  },
};

const themeScript = `
(function(){try{var t=localStorage.getItem('sorell-theme');if(t==='dark')document.documentElement.setAttribute('data-theme','dark');}catch(e){}})();
`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr" className={inter.variable}>
      <head>
        <Script
          id="gtm-script"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-WZMXL3FN');`,
          }}
        />
        <link
          rel="preload"
          href="/fonts/quiglet.otf"
          as="font"
          type="font/otf"
          crossOrigin="anonymous"
        />
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "Organization",
                  "name": "Sorell",
                  "url": "https://sorell.fr",
                  "logo": "https://sorell.fr/icon.svg",
                  "description": "Sorell génère et envoie automatiquement des newsletters sectorielles personnalisées par IA aux entreprises B2B.",
                  "email": "noe@sorell.fr",
                  "address": {
                    "@type": "PostalAddress",
                    "streetAddress": "315, Chemin des Ventarelles",
                    "addressLocality": "Aix-en-Provence",
                    "postalCode": "13090",
                    "addressCountry": "FR"
                  },
                  "sameAs": []
                },
                {
                  "@type": "SoftwareApplication",
                  "name": "Sorell",
                  "url": "https://sorell.fr",
                  "applicationCategory": "BusinessApplication",
                  "operatingSystem": "Web",
                  "description": "Outil SaaS de newsletter automatique par IA. Sorell analyse plus de 147 sources, génère des newsletters sectorielles personnalisées en 12 secondes et les envoie automatiquement à vos équipes chaque semaine. Couvre plus de 30 secteurs d'activité.",
                  "offers": [
                    {
                      "@type": "Offer",
                      "name": "Free",
                      "price": "0",
                      "priceCurrency": "EUR",
                      "description": "2 newsletters par mois, 1 destinataire, brief personnalisé"
                    },
                    {
                      "@type": "Offer",
                      "name": "Pro",
                      "price": "19",
                      "priceCurrency": "EUR",
                      "priceValidUntil": "2026-12-31",
                      "description": "4 newsletters par mois, 5 destinataires, sources au choix, analytics complets, personnalisation couleur"
                    },
                    {
                      "@type": "Offer",
                      "name": "Business",
                      "price": "49",
                      "priceCurrency": "EUR",
                      "priceValidUntil": "2026-12-31",
                      "description": "Newsletters illimitées, 25 destinataires, logo personnalisé, planification avancée, support prioritaire"
                    }
                  ],
                  "featureList": [
                    "Newsletter automatique par IA",
                    "Analyse de 147+ sources en temps réel",
                    "Génération en 12 secondes",
                    "30+ secteurs couverts",
                    "Brief personnalisé",
                    "Envoi automatique hebdomadaire ou mensuel",
                    "Analytics de lecture",
                    "Personnalisation visuelle",
                    "Multi-destinataires"
                  ],
                  "screenshot": "https://sorell.fr/og-image.png"
                },
                {
                  "@type": "HowTo",
                  "name": "Comment utiliser Sorell pour automatiser sa veille sectorielle",
                  "description": "Configurez votre newsletter automatique en 5 minutes avec Sorell.",
                  "totalTime": "PT5M",
                  "step": [
                    {
                      "@type": "HowToStep",
                      "position": 1,
                      "name": "Décrivez votre activité",
                      "text": "En quelques lignes, décrivez votre secteur et ce qui vous intéresse. Sorell comprend votre besoin et adapte le contenu."
                    },
                    {
                      "@type": "HowToStep",
                      "position": 2,
                      "name": "L'IA recherche et rédige",
                      "text": "Sorell analyse plus de 147 sources web, sélectionne les actualités pertinentes et rédige un briefing éditorial complet en 12 secondes."
                    },
                    {
                      "@type": "HowToStep",
                      "position": 3,
                      "name": "Recevez votre newsletter par email",
                      "text": "Chaque semaine, un email professionnel arrive dans votre boîte avec les actualités de votre secteur. Partagez-le avec votre équipe."
                    }
                  ]
                }
              ]
            })
          }}
        />
      </head>
      <body className="antialiased">
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-WZMXL3FN"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>
        <ThemeProvider>
          <AuthProvider>
            <LanguageProvider>
              <div data-page-content="">
                {children}
              </div>
            </LanguageProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
