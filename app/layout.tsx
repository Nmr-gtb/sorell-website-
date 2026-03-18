import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ThemeProvider from "@/components/ThemeProvider";
import { AuthProvider } from "@/lib/AuthContext";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
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
        <ThemeProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
