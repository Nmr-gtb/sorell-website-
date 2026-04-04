"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

interface Newsletter {
  id: string;
  user_id: string;
  user_email: string;
  user_name: string;
  subject: string;
  status: string;
  recipient_count: number;
  created_at: string;
  sent_at: string | null;
  opens: number;
  clicks: number;
  open_rate: number;
  click_rate: number;
}

export default function AdminNewslettersPage() {
  const [newsletters, setNewsletters] = useState<Newsletter[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");

  const fetchNewsletters = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "25" });
      if (statusFilter) params.set("status", statusFilter);

      const res = await fetch(`/api/admin/newsletters?${params}`, { credentials: "include" });
      const data = await res.json();
      setNewsletters(data.newsletters || []);
      setTotal(data.total || 0);
    } catch {
      // Error
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    fetchNewsletters();
  }, [fetchNewsletters]);

  const totalPages = Math.ceil(total / 25);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Newsletters</h1>
        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            <option value="">Tous les statuts</option>
            <option value="sent">Envoyées</option>
            <option value="draft">Brouillons</option>
          </select>
          <span className="text-sm text-gray-400">{total} au total</span>
        </div>
      </div>

      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b border-gray-800">
              <th className="px-4 py-3 font-medium">Utilisateur</th>
              <th className="px-4 py-3 font-medium">Sujet</th>
              <th className="px-4 py-3 font-medium">Statut</th>
              <th className="px-4 py-3 font-medium">Dest.</th>
              <th className="px-4 py-3 font-medium">Ouvertures</th>
              <th className="px-4 py-3 font-medium">Clics</th>
              <th className="px-4 py-3 font-medium">Date</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">Chargement...</td></tr>
            ) : newsletters.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">Aucune newsletter.</td></tr>
            ) : (
              newsletters.map((nl) => (
                <tr key={nl.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                  <td className="px-4 py-3">
                    <Link href={`/admin/users/${nl.user_id}`} className="text-blue-400 hover:text-blue-300 text-xs">
                      {nl.user_name || nl.user_email}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-white max-w-[300px] truncate">{nl.subject || "Sans sujet"}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs ${nl.status === "sent" ? "bg-green-900/30 text-green-400" : "bg-yellow-900/30 text-yellow-400"}`}>
                      {nl.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400">{nl.recipient_count}</td>
                  <td className="px-4 py-3 text-gray-400">
                    {nl.opens} <span className="text-gray-600">({nl.open_rate}%)</span>
                  </td>
                  <td className="px-4 py-3 text-gray-400">
                    {nl.clicks} <span className="text-gray-600">({nl.click_rate}%)</span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {nl.sent_at
                      ? new Date(nl.sent_at).toLocaleDateString("fr-FR")
                      : new Date(nl.created_at).toLocaleDateString("fr-FR")}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 bg-gray-800 rounded text-sm text-gray-300 disabled:opacity-50 hover:bg-gray-700"
          >
            Précédent
          </button>
          <span className="text-sm text-gray-400">Page {page} / {totalPages}</span>
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
