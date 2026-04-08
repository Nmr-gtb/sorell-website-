"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import AdminCard from "@/components/admin/AdminCard";
import AdminTable from "@/components/admin/AdminTable";
import StatusBadge, { getStatusBadgeVariant } from "@/components/admin/StatusBadge";
import { AdminSelect } from "@/components/admin/AdminInput";
import AdminButton from "@/components/admin/AdminButton";
import { ChevronLeftIcon, ChevronRightIcon, MailIcon } from "@/components/admin/AdminIcons";

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

function RateBar({ rate, color, label }: { rate: number; color: string; label: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex flex-col items-end gap-0.5">
        <span className="text-xs font-semibold text-[var(--text)]">{rate}%</span>
        <span className="text-[10px] text-[var(--text-muted)]">{label}</span>
      </div>
      <div className="h-2.5 w-24 overflow-hidden rounded-full bg-[var(--surface-alt)]">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${color}`}
          style={{ width: `${Math.min(rate, 100)}%` }}
        />
      </div>
    </div>
  );
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
    <div className="space-y-6 animate-[fadeInUp_0.3s_ease-out]">
      {/* Page header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text)]">Newsletters</h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">Historique et performance de toutes les newsletters</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--accent-subtle)]">
            <MailIcon size={18} className="text-[var(--accent)]" />
          </div>
          <div>
            <div className="text-xl font-bold text-[var(--text)]">{total}</div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">au total</div>
          </div>
        </div>
      </div>

      {/* Filters card */}
      <AdminCard padding="sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-[var(--text-secondary)]">Filtrer par statut</span>
          </div>
          <AdminSelect
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            options={[
              { value: "", label: "Tous les statuts" },
              { value: "sent", label: "Envoyées" },
              { value: "draft", label: "Brouillons" },
            ]}
            className="w-48"
          />
        </div>
      </AdminCard>

      {/* Table */}
      <AdminTable
        columns={[
          {
            key: "user",
            header: "Utilisateur",
            render: (nl: Newsletter) => (
              <Link
                href={`/admin/users/${nl.user_id}`}
                className="group flex items-center gap-2.5"
              >
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[var(--accent-subtle)] text-xs font-bold text-[var(--accent)]">
                  {(nl.user_name || nl.user_email || "?")[0].toUpperCase()}
                </div>
                <span className="text-sm font-medium text-[var(--accent)] transition-colors group-hover:underline">
                  {nl.user_name || nl.user_email || "Inconnu"}
                </span>
              </Link>
            ),
          },
          {
            key: "subject",
            header: "Sujet",
            render: (nl: Newsletter) => (
              <span className="block max-w-[280px] truncate text-sm font-medium text-[var(--text)]">
                {nl.subject || "Sans sujet"}
              </span>
            ),
          },
          {
            key: "status",
            header: "Statut",
            render: (nl: Newsletter) => (
              <StatusBadge
                label={nl.status === "sent" ? "Envoyée" : nl.status === "draft" ? "Brouillon" : nl.status}
                variant={getStatusBadgeVariant(nl.status)}
              />
            ),
          },
          {
            key: "recipients",
            header: "Dest.",
            render: (nl: Newsletter) => (
              <span className="text-sm font-medium text-[var(--text)]">{nl.recipient_count}</span>
            ),
          },
          {
            key: "engagement",
            header: "Engagement",
            render: (nl: Newsletter) => (
              <div className="flex flex-col gap-1.5">
                <RateBar rate={nl.open_rate} color="bg-gradient-to-r from-teal-400 to-teal-500" label={`${nl.opens} ouv.`} />
                <RateBar rate={nl.click_rate} color="bg-gradient-to-r from-purple-400 to-purple-500" label={`${nl.clicks} clics`} />
              </div>
            ),
          },
          {
            key: "date",
            header: "Date",
            render: (nl: Newsletter) => (
              <span className="text-xs text-[var(--text-muted)]">
                {nl.sent_at
                  ? new Date(nl.sent_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })
                  : new Date(nl.created_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })}
              </span>
            ),
          },
        ]}
        data={newsletters}
        keyExtractor={(nl: Newsletter) => nl.id}
        loading={loading}
        emptyMessage="Aucune newsletter."
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <AdminCard padding="sm">
          <div className="flex items-center justify-between">
            <span className="text-sm text-[var(--text-muted)]">
              {(page - 1) * 25 + 1}-{Math.min(page * 25, total)} sur {total} newsletters
            </span>
            <div className="flex items-center gap-3">
              <AdminButton
                variant="secondary"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                icon={<ChevronLeftIcon size={14} />}
              >
                Précédent
              </AdminButton>
              <span className="text-sm text-[var(--text-secondary)]">
                <span className="font-semibold text-[var(--text)]">{page}</span> / {totalPages}
              </span>
              <AdminButton
                variant="secondary"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                icon={<ChevronRightIcon size={14} />}
              >
                Suivant
              </AdminButton>
            </div>
          </div>
        </AdminCard>
      )}
    </div>
  );
}
