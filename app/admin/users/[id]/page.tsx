"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import AdminCard from "@/components/admin/AdminCard";
import AdminButton from "@/components/admin/AdminButton";
import AdminTable from "@/components/admin/AdminTable";
import StatusBadge, { getPlanBadgeVariant, getStatusBadgeVariant } from "@/components/admin/StatusBadge";
import { AdminSelect } from "@/components/admin/AdminInput";
import { SkeletonDashboard } from "@/components/admin/Skeleton";
import {
  ArrowLeftIcon,
  TrashIcon,
  ExternalLinkIcon,
  AlertTriangleIcon,
} from "@/components/admin/AdminIcons";

interface UserDetail {
  profile: {
    id: string;
    email: string;
    full_name: string;
    plan: string;
    created_at: string;
    trial_ends_at: string | null;
    stripe_customer_id: string | null;
    stripe_subscription_id: string | null;
    referral_code: string | null;
    referred_by: string | null;
  };
  config: {
    topics: string[];
    custom_topics: string[];
    custom_brief: string;
    sources: string;
    frequency: string;
    send_day: string;
    send_hour: number;
    recipients: unknown;
    brand_color: string;
  } | null;
  newsletters: {
    id: string;
    subject: string;
    status: string;
    created_at: string;
    sent_at: string | null;
    recipient_count: number;
    content: unknown;
  }[];
  recipients: { id: string; email: string; created_at: string }[];
  lifecycleEmails: { email_type: string; sent_at: string }[];
  events: { newsletter_id: string; event_type: string; recipient_email: string; created_at: string }[];
  referrals: { id: string; code: string; status: string; created_at: string }[];
}

const PLAN_LABELS: Record<string, string> = {
  free: "Free",
  pro: "Pro",
  business: "Business",
  enterprise: "Enterprise",
};

const TAB_LIST = [
  { key: "overview", label: "Config" },
  { key: "newsletters", label: "Newsletters" },
  { key: "lifecycle", label: "Lifecycle" },
  { key: "events", label: "Events" },
] as const;

type TabKey = typeof TAB_LIST[number]["key"];

export default function AdminUserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [data, setData] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [editPlan, setEditPlan] = useState("");
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<TabKey>("overview");

  useEffect(() => {
    fetch(`/api/admin/users/${id}`, { credentials: "include" })
      .then((res) => res.json())
      .then((d) => {
        setData(d);
        setEditPlan(d.profile?.plan || "free");
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  async function handlePlanChange() {
    setSaving(true);
    try {
      await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ plan: editPlan }),
      });
      setData((prev) => prev ? { ...prev, profile: { ...prev.profile, plan: editPlan } } : prev);
    } catch {
      // Error
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Supprimer cet utilisateur ? Cette action est irréversible.")) return;
    try {
      await fetch(`/api/admin/users/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      router.push("/admin/users");
    } catch {
      // Error
    }
  }

  if (loading) return <SkeletonDashboard />;
  if (!data?.profile) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="rounded-xl border border-red-800/50 bg-red-950/20 px-6 py-4 text-sm text-red-400">
          Utilisateur non trouvé.
        </div>
      </div>
    );
  }

  const { profile, config, newsletters, recipients, lifecycleEmails, events } = data;

  return (
    <div className="space-y-6 animate-[fadeInUp_0.3s_ease-out]">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin/users"
          className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm text-[#6B7280] transition-colors hover:bg-[#1E2030] hover:text-[#F3F4F6]"
        >
          <ArrowLeftIcon size={16} />
          Retour
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-500/10 text-sm font-bold text-teal-400">
            {(profile.full_name || profile.email)[0].toUpperCase()}
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#F3F4F6]">{profile.full_name || profile.email}</h1>
            <span className="text-xs text-[#6B7280]">{profile.email}</span>
          </div>
        </div>
      </div>

      {/* Profile card */}
      <AdminCard>
        <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
          <InfoField label="Email" value={profile.email} />
          <div>
            <div className="mb-1.5 text-xs font-medium uppercase tracking-wider text-[#6B7280]">Plan</div>
            <div className="flex items-center gap-2">
              <AdminSelect
                value={editPlan}
                onChange={(e) => setEditPlan(e.target.value)}
                options={[
                  { value: "free", label: "Free" },
                  { value: "pro", label: "Pro" },
                  { value: "business", label: "Business" },
                  { value: "enterprise", label: "Enterprise" },
                ]}
                className="!w-auto"
              />
              {editPlan !== profile.plan && (
                <AdminButton
                  size="sm"
                  onClick={handlePlanChange}
                  loading={saving}
                >
                  Sauver
                </AdminButton>
              )}
            </div>
          </div>
          <InfoField
            label="Inscription"
            value={new Date(profile.created_at).toLocaleDateString("fr-FR")}
          />
          <InfoField
            label="Trial"
            value={
              profile.trial_ends_at
                ? new Date(profile.trial_ends_at).toLocaleDateString("fr-FR")
                : "\u2014"
            }
          />
          <InfoField
            label="Stripe ID"
            value={profile.stripe_customer_id || "\u2014"}
            mono
          />
          <InfoField
            label="Code parrainage"
            value={profile.referral_code || "\u2014"}
          />
          <InfoField
            label="Newsletters envoyées"
            value={String(newsletters.filter((n) => n.status === "sent").length)}
          />
          <InfoField
            label="Destinataires"
            value={String(recipients.length)}
          />
        </div>
      </AdminCard>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg border border-[#2A2D38] bg-[#161820] p-1 w-fit">
        {TAB_LIST.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-all duration-150 ${
              tab === t.key
                ? "bg-teal-500/10 text-teal-400 shadow-sm"
                : "text-[#6B7280] hover:text-[#9CA3AF]"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "overview" && config && (
        <AdminCard>
          <h2 className="mb-5 text-base font-semibold text-[#F3F4F6]">Configuration Newsletter</h2>
          <div className="grid grid-cols-2 gap-5 text-sm">
            <InfoField
              label="Topics"
              value={[...(config.topics || []), ...(config.custom_topics || [])].join(", ") || "\u2014"}
            />
            <InfoField
              label="Fréquence"
              value={`${config.frequency || "\u2014"} - ${config.send_day || "\u2014"} à ${config.send_hour}h`}
            />
            <InfoField label="Sources" value={config.sources || "\u2014"} />
            <InfoField label="Couleur" value={config.brand_color || "défaut"} />
          </div>
          {config.custom_brief && (
            <div className="mt-5">
              <div className="mb-1.5 text-xs font-medium uppercase tracking-wider text-[#6B7280]">Brief custom</div>
              <p className="rounded-lg border border-[#2A2D38] bg-[#161820] p-4 text-sm text-[#9CA3AF]">
                {config.custom_brief}
              </p>
            </div>
          )}
          <div className="mt-5">
            <div className="mb-2 text-xs font-medium uppercase tracking-wider text-[#6B7280]">Destinataires</div>
            <div className="flex flex-wrap gap-2">
              {recipients.map((r) => (
                <span
                  key={r.id}
                  className="rounded-md border border-[#2A2D38] bg-[#161820] px-2.5 py-1 text-xs text-[#9CA3AF]"
                >
                  {r.email}
                </span>
              ))}
            </div>
          </div>
          <Link
            href={`/admin/prompts?userId=${id}`}
            className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-teal-400 transition-colors hover:text-teal-300"
          >
            <ExternalLinkIcon size={14} />
            Voir le prompt complet
          </Link>
        </AdminCard>
      )}

      {tab === "overview" && !config && (
        <AdminCard>
          <p className="text-sm text-[#6B7280]">Cet utilisateur n&apos;a pas encore configuré sa newsletter.</p>
        </AdminCard>
      )}

      {tab === "newsletters" && (
        <AdminTable
          columns={[
            {
              key: "subject",
              header: "Sujet",
              render: (nl) => (
                <span className="text-sm font-medium text-[#F3F4F6]">
                  {nl.subject || "Sans sujet"}
                </span>
              ),
            },
            {
              key: "status",
              header: "Statut",
              render: (nl) => (
                <StatusBadge
                  label={nl.status}
                  variant={getStatusBadgeVariant(nl.status)}
                />
              ),
            },
            {
              key: "recipients",
              header: "Destinataires",
              render: (nl) => (
                <span className="text-sm text-[#9CA3AF]">{nl.recipient_count || 0}</span>
              ),
            },
            {
              key: "date",
              header: "Date",
              render: (nl) => (
                <span className="text-xs text-[#9CA3AF]">
                  {nl.sent_at
                    ? new Date(nl.sent_at).toLocaleDateString("fr-FR")
                    : new Date(nl.created_at).toLocaleDateString("fr-FR")}
                </span>
              ),
            },
          ]}
          data={newsletters}
          keyExtractor={(nl) => nl.id}
          emptyMessage="Aucune newsletter."
        />
      )}

      {tab === "lifecycle" && (
        <AdminCard>
          <h2 className="mb-5 text-base font-semibold text-[#F3F4F6]">Timeline Lifecycle Emails</h2>
          {lifecycleEmails.length === 0 ? (
            <p className="text-sm text-[#6B7280]">Aucun email lifecycle envoyé.</p>
          ) : (
            <div className="relative space-y-0">
              {lifecycleEmails.map((le, i) => (
                <div key={i} className="relative flex gap-4 pb-6 last:pb-0">
                  {/* Timeline line */}
                  {i < lifecycleEmails.length - 1 && (
                    <div className="absolute left-[7px] top-4 h-full w-px bg-[#2A2D38]" />
                  )}
                  {/* Dot */}
                  <div className="relative z-10 mt-1 flex h-4 w-4 flex-shrink-0 items-center justify-center">
                    <div className="h-3 w-3 rounded-full bg-teal-400 ring-4 ring-[#1A1C25]" />
                  </div>
                  {/* Content */}
                  <div className="flex flex-1 items-center justify-between rounded-lg border border-[#2A2D38] bg-[#161820] px-4 py-3">
                    <span className="text-sm font-medium text-[#F3F4F6]">{le.email_type}</span>
                    <span className="text-xs text-[#6B7280]">
                      {new Date(le.sent_at).toLocaleDateString("fr-FR")} à{" "}
                      {new Date(le.sent_at).toLocaleTimeString("fr-FR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </AdminCard>
      )}

      {tab === "events" && (
        <AdminTable
          columns={[
            {
              key: "type",
              header: "Type",
              render: (e) => (
                <StatusBadge
                  label={e.event_type}
                  variant={getStatusBadgeVariant(e.event_type)}
                />
              ),
            },
            {
              key: "email",
              header: "Email destinataire",
              render: (e) => (
                <span className="text-sm text-[#9CA3AF]">{e.recipient_email}</span>
              ),
            },
            {
              key: "date",
              header: "Date",
              render: (e) => (
                <span className="text-xs text-[#9CA3AF]">
                  {new Date(e.created_at).toLocaleString("fr-FR")}
                </span>
              ),
            },
          ]}
          data={events}
          keyExtractor={(_, i) => String(i)}
          emptyMessage="Aucun événement."
        />
      )}

      {/* Danger zone */}
      <AdminCard variant="danger">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-red-500/10">
            <AlertTriangleIcon size={20} className="text-red-400" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-red-400">Zone dangereuse</h2>
            <p className="mt-1 text-sm text-[#6B7280]">
              La suppression est irréversible. Toutes les données seront perdues.
            </p>
            <AdminButton
              variant="danger"
              size="sm"
              onClick={handleDelete}
              icon={<TrashIcon size={14} />}
              className="mt-3"
            >
              Supprimer cet utilisateur
            </AdminButton>
          </div>
        </div>
      </AdminCard>
    </div>
  );
}

function InfoField({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div>
      <div className="mb-1 text-xs font-medium uppercase tracking-wider text-[#6B7280]">
        {label}
      </div>
      <div
        className={`text-sm text-[#F3F4F6] ${mono ? "font-mono text-xs" : ""}`}
      >
        {value}
      </div>
    </div>
  );
}
