import type { Metadata } from "next";
import { Inter } from "next/font/google";
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
    default: "Sorell — Un email par semaine. Tout ce qu'il faut savoir sur votre secteur.",
    template: "%s — Sorell",
  },
  description: "Sorell vous envoie automatiquement un résumé des actualités de votre secteur. Rien à faire — vous recevez, vous lisez, vous êtes à jour. Gratuit.",
  keywords: ["newsletter IA", "veille sectorielle", "newsletter automatique", "intelligence artificielle", "veille concurrentielle", "newsletter B2B", "newsletter personnalisée", "veille réglementaire"],
  authors: [{ name: "Sorell" }],
  creator: "Sorell",
  publisher: "Sorell",
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: "https://sorell.fr",
    siteName: "Sorell",
    title: "Sorell — Un email par semaine. Tout ce qu'il faut savoir sur votre secteur.",
    description: "Sorell vous envoie automatiquement un résumé des actualités de votre secteur. Rien à faire — vous recevez, vous lisez, vous êtes à jour. Gratuit.",
    images: [
      {
        url: "/og-image.svg",
        width: 1200,
        height: 630,
        alt: "Sorell — Newsletter IA pour les professionnels",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Sorell — Un email par semaine. Tout ce qu'il faut savoir sur votre secteur.",
    description: "Sorell vous envoie automatiquement un résumé des actualités de votre secteur. Rien à faire — vous recevez, vous lisez, vous êtes à jour. Gratuit.",
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
  icons: { icon: "/favicon.svg" },
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
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              "name": "Sorell",
              "applicationCategory": "BusinessApplication",
              "operatingSystem": "Web",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "EUR",
              },
              "description": "Newsletter IA automatisée pour la veille sectorielle B2B",
              "url": "https://sorell.fr",
            }),
          }}
        />
        <ThemeProvider>
          <AuthProvider>
            <LanguageProvider>
              {children}
            </LanguageProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
