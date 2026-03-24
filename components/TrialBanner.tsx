"use client";
import { useAuth } from "@/lib/AuthContext";

export default function TrialBanner() {
  const { user } = useAuth();
  if (user) return null;

  return (
    <div
      style={{
        background: "#111827",
        color: "white",
        textAlign: "center",
        padding: "8px 16px",
        fontSize: 13,
        fontWeight: 500,
        letterSpacing: "0.01em",
      }}
    >
      Essayez Pro gratuitement pendant 15 jours - Sans engagement
      <a
        href="/tarifs"
        style={{
          color: "#60A5FA",
          marginLeft: 12,
          textDecoration: "underline",
          fontWeight: 600,
        }}
      >
        Découvrir les offres →
      </a>
    </div>
  );
}
