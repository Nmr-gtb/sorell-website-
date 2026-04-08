"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";

const AdminCharts = dynamic(
  () => import("@/components/admin/AdminCharts"),
  { ssr: false, loading: () => <div className="h-[320px] animate-pulse rounded-[20px] bg-[var(--border)]/40" /> }
);
import KpiCard from "@/components/admin/KpiCard";
import AdminTable from "@/components/admin/AdminTable";
import AdminCard from "@/components/admin/AdminCard";
import StatusBadge, { getPlanBadgeVariant } from "@/components/admin/StatusBadge";
import { SkeletonDashboard } from "@/components/admin/Skeleton";
import {
  UsersIcon,
  TrendUpIcon,
  ActivityIcon,
  DollarIcon,
} from "@/components/admin/AdminIcons";

interface Stats {
  totalUsers: number;
  newUsers: number;
  activeUsers: number;
  mrr: number;
  trialConversionRate: number;
  planDistribution: { free: number; pro: number; business: number; enterprise: number };
  signupsChart: { date: string; count: number }[];
  recentUsers: { id: string; email: string; full_name: string; plan: string; created_at: string; referred_by: string | null }[];
}

const PLAN_COLORS: Record<string, string> = {
  free: "#9CA3AF",
  pro: "#0D9488",
  business: "#7C3AED",
  enterprise: "#D97706",
};

const PLAN_LABELS: Record<string, string> = {
  free: "Free",
  pro: "Pro",
  business: "Business",
  enterprise: "Enterprise",
};

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/stats", { credentials: "include" })
      .then((res) => {
        if (!res.ok) throw new Error("Erreur chargement");
        return res.json();
      })
      .then(setStats)
      .catch(() => setError("Erreur de chargement des statistiques."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <SkeletonDashboard />;
  }

  if (error || !stats) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <AdminCard variant="danger" padding="md">
          <div className="text-sm text-red-600">{error || "Erreur inconnue."}</div>
        </AdminCard>
      </div>
    );
  }

  const pieData = Object.entries(stats.planDistribution)
    .filter(([, count]) => count > 0)
    .map(([plan, count]) => ({ name: PLAN_LABELS[plan], value: count, color: PLAN_COLORS[plan] }));

  return (
    <div className="space-y-6 animate-[fadeInUp_0.3s_ease-out]">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text)]">Dashboard Analytics</h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">Vue d&apos;ensemble de votre activite</p>
        </div>
        <div className="flex items-center gap-3">
          <select className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm text-[var(--text)] transition-all hover:border-[var(--border-hover)]">
            <option>Ce mois</option>
            <option>7 derniers jours</option>
            <option>30 derniers jours</option>
          </select>
          <button className="flex items-center gap-2 rounded-xl bg-[var(--accent)] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_2px_8px_rgba(0,80,88,0.25)] transition-all hover:bg-[var(--accent-hover)] active:scale-[0.98]">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Export
          </button>
        </div>
      </div>

      {/* KPI Cards — 5 columns like Bank-Maintain */}
      <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-5">
        <KpiCard
          icon={<UsersIcon size={20} />}
          label="Total utilisateurs"
          value={stats.totalUsers}
          iconBg="bg-[#E6F0F1]"
          iconColor="text-[#005058]"
        />
        <KpiCard
          icon={<TrendUpIcon size={20} />}
          label="Nouveaux (7j)"
          value={stats.newUsers}
          trend={stats.newUsers > 0 ? { value: "+18%", positive: true } : null}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
        />
        <KpiCard
          icon={<DollarIcon size={20} />}
          label="MRR"
          value={`${stats.mrr}\u00A0\u20AC`}
          trend={stats.mrr > 0 ? { value: "+12%", positive: true } : null}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
          accent
        />
        <KpiCard
          icon={<ActivityIcon size={20} />}
          label="Actifs (30j)"
          value={stats.activeUsers}
          iconBg="bg-purple-50"
          iconColor="text-purple-600"
        />
        <KpiCard
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          }
          label="Conversion trial"
          value={`${stats.trialConversionRate}%`}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
        />
      </div>

      {/* Charts */}
      <AdminCharts signupsChart={stats.signupsChart} pieData={pieData} />

      {/* Recent signups table */}
      <AdminCard padding="sm">
        <div className="flex items-center justify-between px-2 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <UsersIcon size={18} />
            </div>
            <div>
              <h2 className="text-[15px] font-semibold text-[var(--text)]">Dernieres inscriptions</h2>
              <p className="text-[12px] text-[var(--text-muted)]">Utilisateurs recemment inscrits</p>
            </div>
          </div>
          <span className="rounded-full bg-[var(--surface-alt)] px-3 py-1 text-xs font-semibold text-[var(--text-muted)]">
            {stats.recentUsers.length} recents
          </span>
        </div>
        <AdminTable
          columns={[
            {
              key: "user",
              header: "Utilisateur",
              render: (user) => (
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[var(--accent-subtle)] text-xs font-bold text-[var(--accent)]">
                    {(user.full_name || user.email)[0].toUpperCase()}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-[var(--text)]">{user.full_name || "-"}</div>
                    <div className="text-[12px] text-[var(--text-muted)]">{user.email}</div>
                  </div>
                </div>
              ),
            },
            {
              key: "plan",
              header: "Plan",
              render: (user) => (
                <StatusBadge
                  label={PLAN_LABELS[user.plan] || user.plan}
                  variant={getPlanBadgeVariant(user.plan)}
                  size="md"
                />
              ),
            },
            {
              key: "source",
              header: "Source",
              render: (user) => (
                <span className="text-sm text-[var(--text-secondary)]">
                  {user.referred_by ? "Referral" : "Direct"}
                </span>
              ),
            },
            {
              key: "date",
              header: "Date",
              render: (user) => (
                <span className="text-sm text-[var(--text-secondary)]">
                  {new Date(user.created_at).toLocaleDateString("fr-FR")}
                </span>
              ),
            },
          ]}
          data={stats.recentUsers}
          keyExtractor={(user) => user.id}
        />
      </AdminCard>
    </div>
  );
}
