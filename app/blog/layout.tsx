import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog — Sorell",
  description: "Conseils, guides et actualités sur la veille sectorielle et les newsletters B2B automatisées.",
  openGraph: {
    title: "Blog — Sorell",
    description: "Conseils, guides et actualités sur la veille sectorielle et les newsletters B2B automatisées.",
    url: "https://sorell.fr/blog",
    images: ["/og-image.png"],
  },
  alternates: { canonical: "https://sorell.fr/blog" },
};

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return children;
}
