import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Connexion",
  description: "Connectez-vous à votre espace Sorell pour gérer vos newsletters, configurer vos thématiques et suivre vos analytics.",
  openGraph: {
    title: "Connexion | Sorell",
    description: "Connectez-vous à votre espace Sorell.",
    url: "https://sorell.fr/connexion",
  },
  alternates: { canonical: "https://sorell.fr/connexion" },
  robots: { index: false, follow: true },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
