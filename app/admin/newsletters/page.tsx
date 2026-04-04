"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import AdminTable from "@/components/admin/AdminTable";
import StatusBadge, { getStatusBadgeVariant } from "@/components/admin/StatusBadge";
import { AdminSelect } from "@/components/admin/AdminInput";
import AdminButton from "@/components/admin/AdminButton";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/admin/AdminIcons";

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

function RateBar({ rate, color }: { rate: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-[#E5E7EB]">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${Math.min(rate, 100)}%` }}
        />
      </div>
      <span className="text-xs text-[#6B7280]">{rate}%</span>
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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#111827]">Newsletters</h1>
        <div className="flex items-center gap-3">
          <AdminSelect
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            options={[
              { value: "", label: "Tous les statuts" },
              { value: "sent", label: "Envoyées" },
              { value: "draft", label: "Brouillons" },
            ]}
            className="w-44"
          />
          <span className="rounded-full bg-[#E5E7EB] px-3 py-1 text-xs font-medium text-[#9CA3AF]">
            {total} au total
          </span>
        </div>
      </div>

      <AdminTable
        columns={[
          {
            key: "user",
            header: "Utilisateur",
            render: (nl: Newsletter) => (
              <Link
                href={`/admin/users/${nl.user_id}`}
                className="text-xs font-medium text-[#005058] transition-colors hover:text-[#0D9488]"
              >
                {nl.user_name || nl.user_email}
              </Link>
            ),
          },
          {
            key: "subject",
            header: "Sujet",
            render: (nl: Newsletter) => (
              <span className="block max-w-[300px] truncate text-sm font-medium text-[#111827]">
                {nl.subject || "Sans sujet"}
              </span>
            ),
          },
          {
            key: "status",
            header: "Statut",
            render: (nl: Newsletter) => (
              <StatusBadge
                label={nl.status}
                variant={getStatusBadgeVariant(nl.status)}
              />
            ),
          },
          {
            key: "recipients",
            header: "Dest.",
            render: (nl: Newsletter) => (
              <span className="text-sm text-[#9CA3AF]">{nl.recipient_count}</span>
            ),
          },
          {
            key: "opens",
            header: "Ouvertures",
            render: (nl: Newsletter) => (
              <div>
                <span className="text-sm font-medium text-[#111827]">{nl.opens}</span>
                <RateBar rate={nl.open_rate} color="bg-teal-400" />
              </div>
            ),
          },
          {
            key: "clicks",
            header: "Clics",
            render: (nl: Newsletter) => (
              <div>
                <span className="text-sm font-medium text-[#111827]">{nl.clicks}</span>
                <RateBar rate={nl.click_rate} color="bg-purple-400" />
              </div>
            ),
          },
          {
            key: "date",
            header: "Date",
            render: (nl: Newsletter) => (
              <span className="text-xs text-[#9CA3AF]">
                {nl.sent_at
                  ? new Date(nl.sent_at).toLocaleDateString("fr-FR")
                  : new Date(nl.created_at).toLocaleDateString("fr-FR")}
              </span>
            ),
          },
        ]}
        data={newsletters}
        keyExtractor={(nl: Newsletter) => nl.id}
        loading={loading}
        emptyMessage="Aucune newsletter."
      />

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <AdminButton
            variant="secondary"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            icon={<ChevronLeftIcon size={14} />}
          >
            Précédent
          </AdminButton>
          <span className="text-sm text-[#6B7280]">
            Page <span className="font-medium text-[#9CA3AF]">{page}</span> / {totalPages}
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
      )}
    </div>
  );
}
