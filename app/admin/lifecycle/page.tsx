"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import AdminCard from "@/components/admin/AdminCard";
import AdminTable from "@/components/admin/AdminTable";
import StatusBadge, { getPlanBadgeVariant } from "@/components/admin/StatusBadge";
import { SkeletonDashboard } from "@/components/admin/Skeleton";
import { CheckIcon, LifecycleIcon } from "@/components/admin/AdminIcons";

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

const STAGE_CONFIG: Record<string, { label: string; variant: BadgeVariant; order: number; icon: string }> = {
  inscrit: { label: "Inscrit", variant: "gray", order: 0, icon: "1" },
  welcome_sent: { label: "Welcome envoyé", variant: "blue", order: 1, icon: "2" },
  onboarding_sent: { label: "Onboarding J+1", variant: "cyan", order: 2, icon: "3" },
  configured: { label: "Config faite", variant: "teal", order: 3, icon: "4" },
  first_newsletter_sent: { label: "1ère NL envoyée", variant: "green", order: 4, icon: "5" },
  trial_reminder_3d: { label: "Trial J-3", variant: "yellow", order: 5, icon: "6" },
  trial_reminder_1d: { label: "Trial J-1", variant: "orange", order: 6, icon: "7" },
  trial_expired: { label: "Trial expiré", variant: "red", order: 7, icon: "8" },
  converted: { label: "Converti", variant: "emerald", order: 8, icon: "\u2713" },
  payment_failed: { label: "Paiement échoué", variant: "red", order: 9, icon: "!" },
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
  const totalUsers = Object.values(stageCounts).reduce((a, b) => a + b, 0);

  if (loading) return <SkeletonDashboard />;

  return (
    <div className="space-y-6 animate-[fadeInUp_0.3s_ease-out]">
      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text)]">Pipeline Lifecycle</h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">Suivez la progression de chaque utilisateur dans le funnel</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--accent-subtle)]">
            <LifecycleIcon size={18} className="text-[var(--accent)]" />
          </div>
          <div>
            <div className="text-xl font-bold text-[var(--text)]">{totalUsers}</div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">dans le pipeline</div>
          </div>
        </div>
      </div>

      {/* Pipeline stages visualization */}
      <AdminCard padding="lg">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[var(--text)]">Étapes du pipeline</h2>
          {stageFilter !== "all" && (
            <button
              onClick={() => setStageFilter("all")}
              className="rounded-lg border border-[var(--border)] px-3 py-1 text-xs font-medium text-[var(--text-secondary)] transition-all hover:border-[var(--accent)] hover:text-[var(--accent)]"
            >
              Voir tout
            </button>
          )}
        </div>
        <div className="flex items-stretch gap-3 overflow-x-auto pb-3">
          {PIPELINE_STAGES.map(([stage, cfg]) => {
            const count = stageCounts[stage] || 0;
            const isActive = stageFilter === stage;
            const isAll = stageFilter === "all";
            const hasUsers = count > 0;
            return (
              <button
                key={stage}
                onClick={() => setStageFilter(isActive ? "all" : stage)}
                className={`group relative flex min-w-[110px] flex-1 flex-col items-center gap-3 rounded-2xl border px-4 py-5 transition-all duration-200 ${
                  isActive
                    ? "border-[var(--accent)] bg-[var(--accent-subtle)] shadow-[0_4px_16px_rgba(0,80,88,0.15)]"
                    : hasUsers
                      ? "border-[var(--border)] bg-[var(--surface)] hover:border-[var(--border-hover)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] hover:-translate-y-0.5"
                      : "border-[var(--border-subtle)] bg-[var(--surface-alt)] opacity-50 hover:opacity-70"
                }`}
              >
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold transition-colors ${
                    isActive
                      ? "bg-[var(--accent)] text-white"
                      : hasUsers
                        ? "bg-[var(--surface-alt)] text-[var(--text)]"
                        : "bg-[var(--border-subtle)] text-[var(--text-muted)]"
                  }`}
                >
                  {count}
                </div>
                <span className={`whitespace-nowrap text-[11px] font-medium leading-tight text-center ${
                  isActive ? "text-[var(--accent)]" : isAll && hasUsers ? "text-[var(--text-secondary)]" : "text-[var(--text-muted)]"
                }`}>
                  {cfg.label}
                </span>
              </button>
            );
          })}
        </div>
      </AdminCard>

      {/* Filtered indicator */}
      {stageFilter !== "all" && (
        <div className="flex items-center gap-2 rounded-xl border border-[var(--accent-border)] bg-[var(--accent-subtle)] px-4 py-2.5">
          <StatusBadge
            label={STAGE_CONFIG[stageFilter]?.label || stageFilter}
            variant={STAGE_CONFIG[stageFilter]?.variant || "gray"}
            size="md"
          />
          <span className="text-sm text-[var(--text-secondary)]">
            - {filtered.length} utilisateur{filtered.length > 1 ? "s" : ""}
          </span>
        </div>
      )}

      {/* Pipeline table */}
      <AdminTable
        columns={[
          {
            key: "user",
            header: "Utilisateur",
            render: (user: PipelineUser) => (
              <Link href={`/admin/users/${user.id}`} className="group flex items-center gap-3">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[var(--accent-subtle)] text-xs font-bold text-[var(--accent)]">
                  {(user.full_name || user.email)[0].toUpperCase()}
                </div>
                <div>
                  <div className="text-sm font-medium text-[var(--accent)] transition-colors group-hover:underline">
                    {user.full_name || "\u2014"}
                  </div>
                  <div className="text-xs text-[var(--text-secondary)]">{user.email}</div>
                </div>
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
            header: "Ancienneté",
            render: (user: PipelineUser) => (
              <span className="text-sm text-[var(--text-muted)]">{user.days_since_signup}j</span>
            ),
          },
          {
            key: "trial",
            header: "Trial",
            render: (user: PipelineUser) => (
              <span className={`text-sm font-medium ${
                user.trial_days_remaining !== null && user.trial_days_remaining <= 0
                  ? "text-red-500"
                  : user.trial_days_remaining !== null && user.trial_days_remaining <= 3
                    ? "text-amber-500"
                    : "text-[var(--text-muted)]"
              }`}>
                {user.trial_days_remaining !== null
                  ? user.trial_days_remaining > 0
                    ? `${user.trial_days_remaining}j restant${user.trial_days_remaining > 1 ? "s" : ""}`
                    : "Expiré"
                  : "\u2014"}
              </span>
            ),
          },
          {
            key: "emails",
            header: "Emails reçus",
            render: (user: PipelineUser) => (
              <div className="flex flex-wrap gap-1 max-w-[200px]">
                {user.emails_received.length === 0 ? (
                  <span className="text-xs text-[var(--text-muted)]">Aucun</span>
                ) : (
                  user.emails_received.map((e, i) => (
                    <span
                      key={i}
                      className="rounded-md border border-[var(--border)] bg-[var(--surface-alt)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--text-secondary)]"
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
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-50">
                  <CheckIcon size={14} className="text-emerald-500" />
                </div>
              ) : (
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--surface-alt)]">
                  <span className="text-xs text-[var(--text-muted)]">{"\u2014"}</span>
                </div>
              )
            ),
          },
          {
            key: "nl",
            header: "NL",
            render: (user: PipelineUser) => (
              user.has_sent_newsletter ? (
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-50">
                  <CheckIcon size={14} className="text-emerald-500" />
                </div>
              ) : (
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--surface-alt)]">
                  <span className="text-xs text-[var(--text-muted)]">{"\u2014"}</span>
                </div>
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
