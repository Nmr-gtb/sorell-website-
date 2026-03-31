import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Comment ca marche",
  description: "Decouvrez comment Sorell genere automatiquement votre newsletter sectorielle par IA. Configuration en 5 minutes, envoi automatique chaque semaine.",
  openGraph: {
    title: "Comment ca marche - Sorell",
    description: "Sorell genere vos newsletters sectorielles en 3 etapes. Configuration en 5 minutes.",
    url: "https://sorell.fr/comment-ca-marche",
  },
  alternates: { canonical: "https://sorell.fr/comment-ca-marche" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
