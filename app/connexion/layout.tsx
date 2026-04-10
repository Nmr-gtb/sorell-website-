import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Connexion — Sorell",
  description: "Connectez-vous à votre espace Sorell pour gérer vos newsletters de veille automatisées.",
  openGraph: {
    title: "Connexion — Sorell",
    description: "Connectez-vous à votre espace Sorell pour gérer vos newsletters de veille automatisées.",
    url: "https://sorell.fr/connexion",
    images: ["/og-image.png"],
  },
  alternates: { canonical: "https://sorell.fr/connexion" },
  robots: { index: false, follow: true },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
