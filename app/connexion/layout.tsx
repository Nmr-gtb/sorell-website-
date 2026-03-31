import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Connexion",
  description: "Connectez-vous a votre espace Sorell pour gerer vos newsletters, configurer vos thematiques et suivre vos analytics.",
  openGraph: {
    title: "Connexion - Sorell",
    description: "Connectez-vous a votre espace Sorell.",
    url: "https://sorell.fr/connexion",
  },
  alternates: { canonical: "https://sorell.fr/connexion" },
  robots: { index: false, follow: true },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
