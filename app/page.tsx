import type { Metadata } from "next";
import HomeContent from "@/components/HomeContent";

// Canonical explicite de la home (le root layout n'en définit plus de globale).
export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default function HomePage() {
  return <HomeContent />;
}
