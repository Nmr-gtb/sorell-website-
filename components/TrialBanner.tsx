"use client";
import { useAuth } from "@/lib/AuthContext";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function TrialBanner() {
  const { user } = useAuth();
  const [plan, setPlan] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("plan").eq("id", user.id).single().then(({ data }) => {
      setPlan(data?.plan || "free");
    });
  }, [user]);

  // Afficher si non connecté OU si connecté en plan free
  if (user && plan !== null && plan !== "free") return null;

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
          color: "#0D9488",
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
