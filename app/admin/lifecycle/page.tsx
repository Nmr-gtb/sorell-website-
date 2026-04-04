"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import AdminCard from "@/components/admin/AdminCard";
import AdminTable from "@/components/admin/AdminTable";
import StatusBadge, { getPlanBadgeVariant } from "@/components/admin/StatusBadge";
import { SkeletonDashboard } from "@/components/admin/Skeleton";
import { CheckIcon } from "@/components/admin/AdminIcons";

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

type BadgeVariant = "gray" | "blue" | "cyan" | "teal" | "green" | "yellow" | "orange" | "red" | "emerald";

const STAGE_CONFIG: Record<string, { label: string; variant: BadgeVariant; order: number }> = {
  inscrit: { label: "Inscrit", variant: "gray", order: 0 },
  welcome_sent: { label: "Welcome envoyé", variant: "blue", order: 1 },
  onboarding_sent: { label: "Onboarding J+1", variant: "cyan", order: 2 },
  configured: { label: "Config faite", variant: "teal", order: 3 },
  first_newsletter_sent: { label: "1ère NL envoyée", variant: "green", order: 4 },
  trial_reminder_3d: { label: "Trial J-3", variant: "yellow", order: 5 },
  trial_reminder_1d: { label: "Trial J-1", variant: "orange", order: 6 },
  trial_expired: { label: "Trial expiré", variant: "red", order: 7 },
  converted: { label: "Converti", variant: "emerald", order: 8 },
  payment_failed: { label: "Paiement échoué", variant: "red", order: 9 },
};

const PIPELINE_STAGES = Object.entries(STAGE_CONFIG).sort((a, b) => a[1].order - b[1].order);

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

  if (loading) return <SkeletonDashboard />;

  return (
    <div className="space-y-6 animate-[fadeInUp_0.3s_ease-out]">
      <h1 className="text-2xl font-bold text-[#111827]">Pipeline Lifecycle Emails</h1>

      {/* Visual pipeline stages */}
      <AdminCard padding="lg">
        <div className="flex items-center overflow-x-auto pb-2">
          {PIPELINE_STAGES.map(([stage, cfg], idx) => {
            const count = stageCounts[stage] || 0;
            const isActive = stageFilter === stage;
            const isAll = stageFilter === "all";
            return (
              <div key={stage} className="flex items-center flex-shrink-0">
                <button
                  onClick={() => setStageFilter(isActive ? "all" : stage)}
                  className={`group relative flex flex-col items-center gap-2 rounded-xl px-4 py-3 transition-all duration-200 ${
                    isActive
                      ? "bg-[#005058]/8 ring-1 ring-[#005058]/20"
                      : isAll && count > 0
                        ? "hover:bg-[#F3F4F6]"
                        : "opacity-40 hover:opacity-70"
                  }`}
                >
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-colors ${
                      isActive
                        ? "bg-[#005058] text-white"
                        : count > 0
                          ? "bg-[#E5E7EB] text-[#111827]"
                          : "bg-[#F3F4F6] text-[#9CA3AF]"
                    }`}
                  >
                    {count}
                  </div>
                  <span className={`whitespace-nowrap text-[10px] font-medium ${
                    isActive ? "text-[#005058]" : "text-[#6B7280]"
                  }`}>
                    {cfg.label}
                  </span>
                </button>
                {idx < PIPELINE_STAGES.length - 1 && (
                  <div className="mx-1 h-px w-6 bg-[#E5E7EB] flex-shrink-0" />
                )}
              </div>
            );
          })}
        </div>
        {stageFilter !== "all" && (
          <button
            onClick={() => setStageFilter("all")}
            className="mt-3 text-xs text-[#6B7280] hover:text-[#9CA3AF] transition-colors"
          >
            Afficher toutes les étapes
          </button>
        )}
      </AdminCard>

      {/* Pipeline table */}
      <AdminTable
        columns={[
          {
            key: "user",
            header: "Utilisateur",
            render: (user: PipelineUser) => (
              <Link
                href={`/admin/users/${user.id}`}
                className="group"
              >
                <div className="text-sm font-medium text-[#005058] transition-colors group-hover:text-[#0D9488]">
                  {user.full_name || "\u2014"}
                </div>
                <div className="text-xs text-[#6B7280]">{user.email}</div>
              </Link>
            ),
          },
          {
            key: "plan",
            header: "Plan",
            render: (user: PipelineUser) => (
              <StatusBadge
                label={user.plan}
                variant={getPlanBadgeVariant(user.plan)}
              />
            ),
          },
          {
            key: "stage",
            header: "Étape actuelle",
            render: (user: PipelineUser) => {
              const stage = STAGE_CONFIG[user.current_stage] || STAGE_CONFIG.inscrit;
              return (
                <StatusBadge
                  label={stage.label}
                  variant={stage.variant}
                  size="md"
                />
              );
            },
          },
          {
            key: "days",
            header: "Jours",
            render: (user: PipelineUser) => (
              <span className="text-sm text-[#9CA3AF]">{user.days_since_signup}j</span>
            ),
          },
          {
            key: "trial",
            header: "Trial",
            render: (user: PipelineUser) => (
              <span className={`text-sm ${
                user.trial_days_remaining !== null && user.trial_days_remaining <= 0
                  ? "text-red-500"
                  : "text-[#9CA3AF]"
              }`}>
                {user.trial_days_remaining !== null
                  ? user.trial_days_remaining > 0
                    ? `${user.trial_days_remaining}j`
                    : "Expiré"
                  : "\u2014"}
              </span>
            ),
          },
          {
            key: "emails",
            header: "Emails reçus",
            render: (user: PipelineUser) => (
              <div className="flex flex-wrap gap-1">
                {user.emails_received.length === 0 ? (
                  <span className="text-xs text-[#D1D5DB]">Aucun</span>
                ) : (
                  user.emails_received.map((e, i) => (
                    <span
                      key={i}
                      className="rounded border border-[#E5E7EB] bg-[#F9FAFB] px-1.5 py-0.5 text-[10px] text-[#6B7280]"
                    >
                      {e}
                    </span>
                  ))
                )}
              </div>
            ),
          },
          {
            key: "config",
            header: "Config",
            render: (user: PipelineUser) => (
              user.has_config ? (
                <CheckIcon size={16} className="text-emerald-500" />
              ) : (
                <span className="text-xs text-[#D1D5DB]">\u2014</span>
              )
            ),
          },
          {
            key: "nl",
            header: "NL",
            render: (user: PipelineUser) => (
              user.has_sent_newsletter ? (
                <CheckIcon size={16} className="text-emerald-500" />
              ) : (
                <span className="text-xs text-[#D1D5DB]">\u2014</span>
              )
            ),
          },
        ]}
        data={filtered}
        keyExtractor={(user: PipelineUser) => user.id}
        emptyMessage="Aucun utilisateur dans cette étape."
      />
    </div>
  );
}
