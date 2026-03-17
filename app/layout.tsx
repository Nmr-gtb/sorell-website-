import type { Metadata } from "next";
import { Cormorant_Garamond, DM_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import ThemeProvider from "@/components/ThemeProvider";

const cormorant = Cormorant_Garamond({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

const dmSans = DM_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Sorell — Newsletter IA pour entreprises",
  description:
    "Sorell génère automatiquement une newsletter personnalisée pour chaque collaborateur de votre entreprise.",
  keywords: "newsletter IA, veille sectorielle, newsletter entreprise, newsletter automatique, IA générative",
  openGraph: {
    title: "Sorell — Newsletter IA pour entreprises",
    description: "Sorell génère automatiquement une newsletter personnalisée pour chaque collaborateur.",
    url: "https://sorell.fr",
    siteName: "Sorell",
    locale: "fr_FR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Sorell — Newsletter IA pour entreprises",
    description: "Veille sectorielle automatique et personnalisée par IA.",
  },
  icons: { icon: "/favicon.svg" },
};

// Prevent flash of unstyled content for dark mode
const themeScript = `
(function(){try{var t=localStorage.getItem('sorell-theme');if(t==='dark')document.documentElement.setAttribute('data-theme','dark');}catch(e){}})();
`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="fr"
      className={`${cormorant.variable} ${dmSans.variable} ${jetbrains.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="antialiased">
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
