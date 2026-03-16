import type { Metadata } from "next";
import { DM_Sans, Playfair_Display } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "Sorell — Newsletters IA personnalisées pour vos équipes",
  description:
    "Sorell génère par IA une newsletter personnalisée pour chaque collaborateur. Veille sectorielle, concurrents, tendances — zéro effort, 100% pertinence.",
  keywords: "newsletter IA, veille sectorielle, newsletter entreprise, newsletter automatique, IA générative",
  openGraph: {
    title: "Sorell — Newsletters IA personnalisées pour vos équipes",
    description: "Sorell génère par IA une newsletter personnalisée pour chaque collaborateur.",
    url: "https://sorell.fr",
    siteName: "Sorell",
    locale: "fr_FR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Sorell — Newsletters IA personnalisées",
    description: "Veille sectorielle automatique et personnalisée par IA.",
  },
  icons: {
    icon: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={`${dmSans.variable} ${playfair.variable}`}>
      <body className="antialiased" style={{ fontFamily: "'DM Sans', sans-serif" }}>
        <Navbar />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
