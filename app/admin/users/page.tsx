"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface User {
  id: string;
  email: string;
  full_name: string;
  plan: string;
  created_at: string;
  trial_ends_at: string | null;
  stripe_customer_id: string | null;
  newsletters_sent: number;
  last_newsletter_at: string | null;
  recipient_count: number;
}

const PLAN_COLORS: Record<string, string> = {
  free: "#6B7280",
  pro: "#3B82F6",
  business: "#8B5CF6",
  enterprise: "#F59E0B",
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState("all");

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "25" });
      if (planFilter !== "all") params.set("plan", planFilter);
      if (search) params.set("search", search);

      const res = await fetch(`/api/admin/users?${params}`, { credentials: "include" });
      const data = await res.json();
      setUsers(data.users || []);
      setTotal(data.total || 0);
    } catch {
      // Error handling
    } finally {
      setLoading(false);
    }
  }, [page, planFilter, search]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const totalPages = Math.ceil(total / 25);

  function getTrialStatus(user: User): string {
    if (user.plan !== "free" && user.plan !== "enterprise") {
      if (!user.trial_ends_at) return "";
      const trialEnd = new Date(user.trial_ends_at);
      const now = new Date();
      if (trialEnd > now) {
        const days = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return `Trial (${days}j)`;
      }
      return "Actif";
    }
    if (user.trial_ends_at) {
      const trialEnd = new Date(user.trial_ends_at);
      if (trialEnd < new Date()) return "Trial expiré";
    }
    return "";
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Utilisateurs</h1>
        <span className="text-sm text-gray-400">{total} au total</span>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          placeholder="Rechercher par email ou nom..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="flex-1 px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
        />
        <select
          value={planFilter}
          onChange={(e) => { setPlanFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
        >
          <option value="all">Tous les plans</option>
          <option value="free">Free</option>
          <option value="pro">Pro</option>
          <option value="business">Business</option>
          <option value="enterprise">Enterprise</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b border-gray-800">
              <th className="px-4 py-3 font-medium">Utilisateur</th>
              <th className="px-4 py-3 font-medium">Plan</th>
              <th className="px-4 py-3 font-medium">Statut</th>
              <th className="px-4 py-3 font-medium">Newsletters</th>
              <th className="px-4 py-3 font-medium">Destinataires</th>
              <th className="px-4 py-3 font-medium">Dernière NL</th>
              <th className="px-4 py-3 font-medium">Inscription</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-gray-500">Chargement...</td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-gray-500">Aucun utilisateur trouvé.</td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-xs font-bold text-gray-300">
                        {(user.full_name || user.email)[0].toUpperCase()}
                      </div>
                      <div>
                        <div className="text-white text-sm">{user.full_name || "—"}</div>
                        <div className="text-gray-500 text-xs">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="px-2 py-0.5 rounded text-xs font-medium"
                      style={{
                        backgroundColor: `${PLAN_COLORS[user.plan] || "#6B7280"}20`,
                        color: PLAN_COLORS[user.plan] || "#6B7280",
                      }}
                    >
                      {user.plan}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400">{getTrialStatus(user)}</td>
                  <td className="px-4 py-3 text-white">{user.newsletters_sent}</td>
                  <td className="px-4 py-3 text-white">{user.recipient_count}</td>
                  <td className="px-4 py-3 text-xs text-gray-400">
                    {user.last_newsletter_at
                      ? new Date(user.last_newsletter_at).toLocaleDateString("fr-FR")
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400">
                    {new Date(user.created_at).toLocaleDateString("fr-FR")}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/users/${user.id}`}
                      className="text-blue-400 hover:text-blue-300 text-xs font-medium"
                    >
                      Détail
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 bg-gray-800 rounded text-sm text-gray-300 disabled:opacity-50 hover:bg-gray-700"
          >
            Précédent
          </button>
          <span className="text-sm text-gray-400">
            Page {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1.5 bg-gray-800 rounded text-sm text-gray-300 disabled:opacity-50 hover:bg-gray-700"
          >
            Suivant
          </button>
        </div>
      )}
    </div>
  );
}
