"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AdminButton from "@/components/admin/AdminButton";
import { AdminInput } from "@/components/admin/AdminInput";
import { MailIcon } from "@/components/admin/AdminIcons";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Erreur de connexion.");
        return;
      }

      router.push("/admin");
    } catch {
      setError("Erreur réseau. Réessayez.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--surface-alt)] px-4">
      <div className="w-full max-w-sm animate-[fadeInUp_0.4s_ease-out] rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 shadow-lg">
        {/* Logo */}
        <div className="mb-10 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--accent-subtle)]">
            <MailIcon className="text-[var(--accent)]" size={24} />
          </div>
          <h1
            className="text-2xl font-bold text-[var(--text)]"
            style={{ fontFamily: "'Quiglet', sans-serif" }}
          >
            Sorell
          </h1>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">Administration</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="animate-[fadeInUp_0.2s_ease-out] rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          <AdminInput
            id="email"
            type="email"
            label="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@sorell.fr"
            required
            autoComplete="email"
          />

          <AdminInput
            id="password"
            type="password"
            label="Mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mot de passe"
            required
            autoComplete="current-password"
          />

          <AdminButton
            type="submit"
            loading={loading}
            className="w-full"
            size="lg"
          >
            {loading ? "Connexion..." : "Se connecter"}
          </AdminButton>
        </form>

        <p className="mt-8 text-center text-xs text-[var(--text-secondary)]">
          Accès réservé aux administrateurs Sorell
        </p>
      </div>
    </div>
  );
}
