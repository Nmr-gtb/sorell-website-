import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Comment ça marche",
  description: "Découvrez comment Sorell génère automatiquement votre newsletter sectorielle par IA. Configuration en 5 minutes, envoi automatique chaque semaine.",
  openGraph: {
    title: "Comment ça marche | Sorell",
    description: "Sorell génère vos newsletters sectorielles en 3 étapes. Configuration en 5 minutes.",
    url: "https://sorell.fr/comment-ca-marche",
  },
  alternates: { canonical: "https://sorell.fr/comment-ca-marche" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
