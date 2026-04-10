import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact — Sorell",
  description: "Une question sur Sorell ? Contactez notre équipe. Réponse sous 24h.",
  openGraph: {
    title: "Contact — Sorell",
    description: "Une question sur Sorell ? Contactez notre équipe. Réponse sous 24h.",
    url: "https://sorell.fr/contact",
    images: ["/og-image.png"],
  },
  alternates: { canonical: "https://sorell.fr/contact" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
