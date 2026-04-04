"use client";

import { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import KpiCard from "@/components/admin/KpiCard";
import AdminCard from "@/components/admin/AdminCard";
import AdminTable from "@/components/admin/AdminTable";
import StatusBadge, { getPlanBadgeVariant } from "@/components/admin/StatusBadge";
import { SkeletonDashboard } from "@/components/admin/Skeleton";
import {
  UsersIcon,
  TrendUpIcon,
  ActivityIcon,
  DollarIcon,
  BarChartIcon,
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
  free: "#6B7280",
  pro: "#0D9488",
  business: "#8B5CF6",
  enterprise: "#F59E0B",
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
        <div className="rounded-xl border border-red-800/50 bg-red-950/20 px-6 py-4 text-sm text-red-400">
          {error || "Erreur inconnue."}
        </div>
      </div>
    );
  }

  const pieData = Object.entries(stats.planDistribution)
    .filter(([, count]) => count > 0)
    .map(([plan, count]) => ({ name: PLAN_LABELS[plan], value: count, color: PLAN_COLORS[plan] }));

  return (
    <div className="space-y-8 animate-[fadeInUp_0.3s_ease-out]">
      <h1 className="text-2xl font-bold text-[#F3F4F6]">Dashboard</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <KpiCard
          icon={<UsersIcon size={20} />}
          label="Total utilisateurs"
          value={stats.totalUsers}
        />
        <KpiCard
          icon={<TrendUpIcon size={20} />}
          label="Nouveaux (7j)"
          value={stats.newUsers}
          accent
        />
        <KpiCard
          icon={<ActivityIcon size={20} />}
          label="Actifs (30j)"
          value={stats.activeUsers}
        />
        <KpiCard
          icon={<DollarIcon size={20} />}
          label="MRR"
          value={`${stats.mrr}\u00A0\u20AC`}
          accent
        />
        <KpiCard
          icon={<BarChartIcon size={20} />}
          label="Conversion trial"
          value={`${stats.trialConversionRate}%`}
        />
        <KpiCard
          icon={<UsersIcon size={20} />}
          label="Plans payants"
          value={stats.planDistribution.pro + stats.planDistribution.business + stats.planDistribution.enterprise}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Signups chart */}
        <AdminCard className="lg:col-span-2">
          <h2 className="mb-5 text-base font-semibold text-[#F3F4F6]">
            Inscriptions (30 derniers jours)
          </h2>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={stats.signupsChart}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2A2D38" />
              <XAxis
                dataKey="date"
                stroke="#6B7280"
                tick={{ fontSize: 11, fill: "#6B7280" }}
                tickFormatter={(d: string) => d.slice(5)}
                axisLine={{ stroke: "#2A2D38" }}
                tickLine={false}
              />
              <YAxis
                stroke="#6B7280"
                tick={{ fontSize: 11, fill: "#6B7280" }}
                allowDecimals={false}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1A1C25",
                  border: "1px solid #2A2D38",
                  borderRadius: "8px",
                  boxShadow: "0 10px 15px -3px rgba(0,0,0,0.5)",
                }}
                labelStyle={{ color: "#9CA3AF", fontSize: 12 }}
                itemStyle={{ color: "#0D9488", fontSize: 12 }}
              />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#0D9488"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: "#0D9488", stroke: "#0F1117", strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </AdminCard>

        {/* Plan distribution */}
        <AdminCard>
          <h2 className="mb-5 text-base font-semibold text-[#F3F4F6]">
            Répartition des plans
          </h2>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                innerRadius={45}
                strokeWidth={0}
                label={({ name, value }: { name: string; value: number }) => `${name}: ${value}`}
              >
                {pieData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1A1C25",
                  border: "1px solid #2A2D38",
                  borderRadius: "8px",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 flex flex-wrap gap-3">
            {pieData.map((p) => (
              <div key={p.name} className="flex items-center gap-2 text-xs text-[#9CA3AF]">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: p.color }}
                />
                {p.name}: {p.value}
              </div>
            ))}
          </div>
        </AdminCard>
      </div>

      {/* Recent signups */}
      <div>
        <h2 className="mb-4 text-base font-semibold text-[#F3F4F6]">
          Dernières inscriptions
        </h2>
        <AdminTable
          columns={[
            {
              key: "user",
              header: "Utilisateur",
              render: (user) => (
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-teal-500/10 text-xs font-bold text-teal-400">
                    {(user.full_name || user.email)[0].toUpperCase()}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-[#F3F4F6]">{user.full_name || "\u2014"}</div>
                    <div className="text-xs text-[#6B7280]">{user.email}</div>
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
                />
              ),
            },
            {
              key: "source",
              header: "Source",
              render: (user) => (
                <span className="text-xs text-[#9CA3AF]">
                  {user.referred_by ? "Referral" : "Direct"}
                </span>
              ),
            },
            {
              key: "date",
              header: "Date",
              render: (user) => (
                <span className="text-xs text-[#9CA3AF]">
                  {new Date(user.created_at).toLocaleDateString("fr-FR")}
                </span>
              ),
            },
          ]}
          data={stats.recentUsers}
          keyExtractor={(user) => user.id}
        />
      </div>
    </div>
  );
}
