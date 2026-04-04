"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

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

export default function AdminUserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [data, setData] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [editPlan, setEditPlan] = useState("");
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState<"overview" | "newsletters" | "lifecycle" | "events">("overview");

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

  if (loading) return <div className="text-gray-400">Chargement...</div>;
  if (!data?.profile) return <div className="text-red-400">Utilisateur non trouvé.</div>;

  const { profile, config, newsletters, recipients, lifecycleEmails, events } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/users" className="text-gray-400 hover:text-white text-sm">&larr; Retour</Link>
        <h1 className="text-2xl font-bold text-white">{profile.full_name || profile.email}</h1>
      </div>

      {/* Profile card */}
      <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div>
          <div className="text-xs text-gray-500">Email</div>
          <div className="text-white text-sm">{profile.email}</div>
        </div>
        <div>
          <div className="text-xs text-gray-500">Plan</div>
          <div className="flex items-center gap-2">
            <select
              value={editPlan}
              onChange={(e) => setEditPlan(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-white"
            >
              <option value="free">Free</option>
              <option value="pro">Pro</option>
              <option value="business">Business</option>
              <option value="enterprise">Enterprise</option>
            </select>
            {editPlan !== profile.plan && (
              <button
                onClick={handlePlanChange}
                disabled={saving}
                className="px-2 py-1 bg-blue-600 rounded text-xs text-white hover:bg-blue-700"
              >
                {saving ? "..." : "Sauver"}
              </button>
            )}
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-500">Inscription</div>
          <div className="text-white text-sm">{new Date(profile.created_at).toLocaleDateString("fr-FR")}</div>
        </div>
        <div>
          <div className="text-xs text-gray-500">Trial</div>
          <div className="text-white text-sm">
            {profile.trial_ends_at
              ? new Date(profile.trial_ends_at).toLocaleDateString("fr-FR")
              : "—"}
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-500">Stripe ID</div>
          <div className="text-white text-sm font-mono text-xs">{profile.stripe_customer_id || "—"}</div>
        </div>
        <div>
          <div className="text-xs text-gray-500">Referral Code</div>
          <div className="text-white text-sm">{profile.referral_code || "—"}</div>
        </div>
        <div>
          <div className="text-xs text-gray-500">Newsletters envoyées</div>
          <div className="text-white text-sm">{newsletters.filter((n) => n.status === "sent").length}</div>
        </div>
        <div>
          <div className="text-xs text-gray-500">Destinataires</div>
          <div className="text-white text-sm">{recipients.length}</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-900 rounded-lg p-1 border border-gray-800 w-fit">
        {(["overview", "newsletters", "lifecycle", "events"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              tab === t ? "bg-gray-800 text-white" : "text-gray-400 hover:text-gray-200"
            }`}
          >
            {t === "overview" ? "Config" : t === "newsletters" ? "Newsletters" : t === "lifecycle" ? "Lifecycle" : "Events"}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === "overview" && config && (
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800 space-y-4">
          <h2 className="text-lg font-semibold text-white">Configuration Newsletter</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Topics : </span>
              <span className="text-white">{[...(config.topics || []), ...(config.custom_topics || [])].join(", ") || "—"}</span>
            </div>
            <div>
              <span className="text-gray-500">Fréquence : </span>
              <span className="text-white">{config.frequency || "—"} — {config.send_day || "—"} à {config.send_hour}h</span>
            </div>
            <div>
              <span className="text-gray-500">Sources : </span>
              <span className="text-white">{config.sources || "—"}</span>
            </div>
            <div>
              <span className="text-gray-500">Couleur : </span>
              <span className="text-white">{config.brand_color || "défaut"}</span>
            </div>
          </div>
          {config.custom_brief && (
            <div>
              <span className="text-gray-500 text-sm">Brief custom : </span>
              <p className="text-white text-sm mt-1 bg-gray-800 rounded p-3">{config.custom_brief}</p>
            </div>
          )}
          <div>
            <span className="text-gray-500 text-sm">Destinataires : </span>
            <div className="flex flex-wrap gap-2 mt-1">
              {recipients.map((r) => (
                <span key={r.id} className="px-2 py-1 bg-gray-800 rounded text-xs text-gray-300">{r.email}</span>
              ))}
            </div>
          </div>
          <Link
            href={`/admin/prompts?userId=${id}`}
            className="inline-block mt-2 text-blue-400 hover:text-blue-300 text-sm"
          >
            Voir le prompt complet &rarr;
          </Link>
        </div>
      )}

      {tab === "overview" && !config && (
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
          <p className="text-gray-400 text-sm">Cet utilisateur n'a pas encore configuré sa newsletter.</p>
        </div>
      )}

      {tab === "newsletters" && (
        <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-800">
                <th className="px-4 py-3 font-medium">Sujet</th>
                <th className="px-4 py-3 font-medium">Statut</th>
                <th className="px-4 py-3 font-medium">Destinataires</th>
                <th className="px-4 py-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {newsletters.length === 0 ? (
                <tr><td colSpan={4} className="px-4 py-6 text-center text-gray-500">Aucune newsletter.</td></tr>
              ) : newsletters.map((nl) => (
                <tr key={nl.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                  <td className="px-4 py-3 text-white">{nl.subject || "Sans sujet"}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs ${nl.status === "sent" ? "bg-green-900/30 text-green-400" : "bg-yellow-900/30 text-yellow-400"}`}>
                      {nl.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400">{nl.recipient_count || 0}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {nl.sent_at ? new Date(nl.sent_at).toLocaleDateString("fr-FR") : new Date(nl.created_at).toLocaleDateString("fr-FR")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === "lifecycle" && (
        <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
          <h2 className="text-lg font-semibold text-white mb-4">Timeline Lifecycle Emails</h2>
          {lifecycleEmails.length === 0 ? (
            <p className="text-gray-500 text-sm">Aucun email lifecycle envoyé.</p>
          ) : (
            <div className="space-y-3">
              {lifecycleEmails.map((le, i) => (
                <div key={i} className="flex items-center gap-4 text-sm">
                  <div className="w-2 h-2 rounded-full bg-blue-400" />
                  <span className="text-white font-medium min-w-[180px]">{le.email_type}</span>
                  <span className="text-gray-400 text-xs">
                    {new Date(le.sent_at).toLocaleDateString("fr-FR")} à {new Date(le.sent_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "events" && (
        <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-gray-800">
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Email destinataire</th>
                <th className="px-4 py-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {events.length === 0 ? (
                <tr><td colSpan={3} className="px-4 py-6 text-center text-gray-500">Aucun événement.</td></tr>
              ) : events.map((e, i) => (
                <tr key={i} className="border-b border-gray-800/50">
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs ${
                      e.event_type === "open" ? "bg-green-900/30 text-green-400" :
                      e.event_type === "click" ? "bg-blue-900/30 text-blue-400" :
                      "bg-red-900/30 text-red-400"
                    }`}>
                      {e.event_type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400">{e.recipient_email}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">
                    {new Date(e.created_at).toLocaleString("fr-FR")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Danger zone */}
      <div className="bg-red-950/30 rounded-xl p-6 border border-red-900/50">
        <h2 className="text-lg font-semibold text-red-400 mb-2">Zone dangereuse</h2>
        <button
          onClick={handleDelete}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm text-white font-medium"
        >
          Supprimer cet utilisateur
        </button>
      </div>
    </div>
  );
}
