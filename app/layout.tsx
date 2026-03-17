import type { Metadata } from "next";
import { DM_Sans, Playfair_Display, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ThemeProvider from "@/components/ThemeProvider";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Sorell — Newsletter IA personnalisée pour vos équipes",
  description:
    "Sorell génère automatiquement une newsletter personnalisée pour chaque collaborateur. Actualités sectorielles, concurrents, tendances — livrée chaque semaine.",
  keywords: "newsletter IA, veille sectorielle, newsletter entreprise, newsletter automatique, IA générative",
  openGraph: {
    title: "Sorell — Newsletter IA personnalisée pour vos équipes",
    description: "Sorell génère automatiquement une newsletter personnalisée pour chaque collaborateur.",
    url: "https://sorell.fr",
    siteName: "Sorell",
    locale: "fr_FR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Sorell — Newsletter IA personnalisée",
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
      className={`${dmSans.variable} ${playfair.variable} ${jetbrains.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="antialiased">
        <ThemeProvider>
          <Navbar />
          <main>{children}</main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
