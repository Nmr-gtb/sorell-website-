import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog",
  description: "Guides, comparatifs et conseils pour automatiser votre veille sectorielle avec l'IA. Decouvrez les meilleures pratiques pour les newsletters B2B.",
  openGraph: {
    title: "Blog - Sorell",
    description: "Guides et conseils pour automatiser votre veille sectorielle avec l'IA.",
    url: "https://sorell.fr/blog",
  },
  alternates: { canonical: "https://sorell.fr/blog" },
};

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return children;
}
