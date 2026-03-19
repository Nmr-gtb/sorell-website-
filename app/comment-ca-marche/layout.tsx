import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Comment ça marche",
  description:
    "Découvrez comment Sorell génère automatiquement des newsletters sectorielles personnalisées par IA. Configuration en 5 minutes, envoi automatique chaque semaine.",
  openGraph: {
    title: "Comment ça marche — Sorell",
    description:
      "Sorell génère vos newsletters sectorielles en 3 étapes. Configuration en 5 minutes, envoi automatique.",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
