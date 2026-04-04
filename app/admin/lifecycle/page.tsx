"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface PipelineUser {
  id: string;
  email: string;
  full_name: string;
  plan: string;
  created_at: string;
  current_stage: string;
  emails_received: string[];
  has_config: boolean;
  has_sent_newsletter: boolean;
  days_since_signup: number;
  trial_days_remaining: number | null;
  is_paid: boolean;
}

const STAGE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  inscrit: { label: "Inscrit", color: "text-gray-400", bg: "bg-gray-800" },
  welcome_sent: { label: "Welcome envoyé", color: "text-blue-400", bg: "bg-blue-900/30" },
  onboarding_sent: { label: "Onboarding J+1", color: "text-cyan-400", bg: "bg-cyan-900/30" },
  configured: { label: "Config faite", color: "text-teal-400", bg: "bg-teal-900/30" },
  first_newsletter_sent: { label: "1ère NL envoyée", color: "text-green-400", bg: "bg-green-900/30" },
  trial_reminder_3d: { label: "Trial J-3", color: "text-yellow-400", bg: "bg-yellow-900/30" },
  trial_reminder_1d: { label: "Trial J-1", color: "text-orange-400", bg: "bg-orange-900/30" },
  trial_expired: { label: "Trial expiré", color: "text-red-400", bg: "bg-red-900/30" },
  converted: { label: "Converti", color: "text-emerald-400", bg: "bg-emerald-900/30" },
  payment_failed: { label: "Paiement échoué", color: "text-red-400", bg: "bg-red-900/30" },
};

export default function AdminLifecyclePage() {
  const [pipeline, setPipeline] = useState<PipelineUser[]>([]);
  const [stageCounts, setStageCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [stageFilter, setStageFilter] = useState("all");

  useEffect(() => {
    fetch("/api/admin/lifecycle", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        setPipeline(data.pipeline || []);
        setStageCounts(data.stageCounts || {});
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = stageFilter === "all" ? pipeline : pipeline.filter((u) => u.current_stage === stageFilter);

  if (loading) return <div className="text-gray-400">Chargement du pipeline...</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Pipeline Lifecycle Emails</h1>

      {/* Stage summary cards */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setStageFilter("all")}
          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            stageFilter === "all" ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700"
          }`}
        >
          Tous ({pipeline.length})
        </button>
        {Object.entries(STAGE_CONFIG).map(([stage, cfg]) => {
          const count = stageCounts[stage] || 0;
          if (count === 0) return null;
          return (
            <button
              key={stage}
              onClick={() => setStageFilter(stage)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                stageFilter === stage
                  ? `${cfg.bg} ${cfg.color} ring-1 ring-current`
                  : "bg-gray-800 text-gray-400 hover:bg-gray-700"
              }`}
            >
              {cfg.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Pipeline table */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b border-gray-800">
              <th className="px-4 py-3 font-medium">Utilisateur</th>
              <th className="px-4 py-3 font-medium">Plan</th>
              <th className="px-4 py-3 font-medium">Étape actuelle</th>
              <th className="px-4 py-3 font-medium">Jours depuis inscription</th>
              <th className="px-4 py-3 font-medium">Trial restant</th>
              <th className="px-4 py-3 font-medium">Emails reçus</th>
              <th className="px-4 py-3 font-medium">Config</th>
              <th className="px-4 py-3 font-medium">NL envoyée</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-500">Aucun utilisateur dans cette étape.</td></tr>
            ) : (
              filtered.map((user) => {
                const stage = STAGE_CONFIG[user.current_stage] || STAGE_CONFIG.inscrit;
                return (
                  <tr key={user.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                    <td className="px-4 py-3">
                      <Link href={`/admin/users/${user.id}`} className="text-blue-400 hover:text-blue-300">
                        <div className="text-sm">{user.full_name || "—"}</div>
                        <div className="text-xs text-gray-500">{user.email}</div>
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs">{user.plan}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${stage.bg} ${stage.color}`}>
                        {stage.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400">{user.days_since_signup}j</td>
                    <td className="px-4 py-3 text-gray-400">
                      {user.trial_days_remaining !== null
                        ? user.trial_days_remaining > 0
                          ? `${user.trial_days_remaining}j`
                          : "Expiré"
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {user.emails_received.length === 0 ? (
                          <span className="text-gray-600 text-xs">Aucun</span>
                        ) : (
                          user.emails_received.map((e, i) => (
                            <span key={i} className="px-1.5 py-0.5 bg-gray-800 rounded text-xs text-gray-400">
                              {e}
                            </span>
                          ))
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {user.has_config ? (
                        <span className="text-green-400 text-xs">Oui</span>
                      ) : (
                        <span className="text-red-400 text-xs">Non</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {user.has_sent_newsletter ? (
                        <span className="text-green-400 text-xs">Oui</span>
                      ) : (
                        <span className="text-red-400 text-xs">Non</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
