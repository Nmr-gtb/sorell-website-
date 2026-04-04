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
  pro: "#3B82F6",
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
    return <div className="text-gray-400">Chargement du dashboard...</div>;
  }

  if (error || !stats) {
    return <div className="text-red-400">{error || "Erreur inconnue."}</div>;
  }

  const pieData = Object.entries(stats.planDistribution)
    .filter(([, count]) => count > 0)
    .map(([plan, count]) => ({ name: PLAN_LABELS[plan], value: count, color: PLAN_COLORS[plan] }));

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-white">Dashboard</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <KpiCard label="Total utilisateurs" value={stats.totalUsers} />
        <KpiCard label="Nouveaux (7j)" value={stats.newUsers} accent />
        <KpiCard label="Actifs (30j)" value={stats.activeUsers} />
        <KpiCard label="MRR" value={`${stats.mrr}€`} accent />
        <KpiCard label="Conversion trial" value={`${stats.trialConversionRate}%`} />
        <KpiCard label="Plans payants" value={stats.planDistribution.pro + stats.planDistribution.business + stats.planDistribution.enterprise} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Signups chart */}
        <div className="lg:col-span-2 bg-gray-900 rounded-xl p-6 border border-gray-800">
          <h2 className="text-lg font-semibold text-white mb-4">Inscriptions (30 derniers jours)</h2>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={stats.signupsChart}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis
                dataKey="date"
                stroke="#6B7280"
                tick={{ fontSize: 11 }}
                tickFormatter={(d: string) => d.slice(5)}
              />
              <YAxis stroke="#6B7280" tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip
                contentStyle={{ backgroundColor: "#1F2937", border: "1px solid #374151", borderRadius: "8px" }}
                labelStyle={{ color: "#9CA3AF" }}
                itemStyle={{ color: "#3B82F6" }}
              />
              <Line type="monotone" dataKey="count" stroke="#3B82F6" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Plan distribution */}
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
          <h2 className="text-lg font-semibold text-white mb-4">Répartition des plans</h2>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                {pieData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap gap-3 mt-3">
            {pieData.map((p) => (
              <div key={p.name} className="flex items-center gap-1.5 text-xs text-gray-400">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                {p.name}: {p.value}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent signups */}
      <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
        <h2 className="text-lg font-semibold text-white mb-4">Dernières inscriptions</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-800">
                <th className="pb-3 font-medium">Utilisateur</th>
                <th className="pb-3 font-medium">Plan</th>
                <th className="pb-3 font-medium">Source</th>
                <th className="pb-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentUsers.map((user) => (
                <tr key={user.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                  <td className="py-3">
                    <div className="text-white">{user.full_name || "—"}</div>
                    <div className="text-gray-500 text-xs">{user.email}</div>
                  </td>
                  <td className="py-3">
                    <span
                      className="px-2 py-0.5 rounded text-xs font-medium"
                      style={{
                        backgroundColor: `${PLAN_COLORS[user.plan]}20`,
                        color: PLAN_COLORS[user.plan],
                      }}
                    >
                      {PLAN_LABELS[user.plan] || user.plan}
                    </span>
                  </td>
                  <td className="py-3 text-gray-400 text-xs">
                    {user.referred_by ? "Referral" : "Direct"}
                  </td>
                  <td className="py-3 text-gray-400 text-xs">
                    {new Date(user.created_at).toLocaleDateString("fr-FR")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function KpiCard({ label, value, accent }: { label: string; value: string | number; accent?: boolean }) {
  return (
    <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className={`text-2xl font-bold ${accent ? "text-blue-400" : "text-white"}`}>{value}</div>
    </div>
  );
}
