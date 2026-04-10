import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Comment ça marche — Sorell",
  description: "Découvrez comment Sorell génère automatiquement vos newsletters de veille sectorielle en 5 étapes simples.",
  openGraph: {
    title: "Comment ça marche — Sorell",
    description: "Découvrez comment Sorell génère automatiquement vos newsletters de veille sectorielle en 5 étapes simples.",
    url: "https://sorell.fr/comment-ca-marche",
    images: ["/og-image.png"],
  },
  alternates: { canonical: "https://sorell.fr/comment-ca-marche" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
