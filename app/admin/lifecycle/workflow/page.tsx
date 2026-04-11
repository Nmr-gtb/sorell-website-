"use client";

import { useState } from "react";

/* ── Types ─────────────────────────────────────────── */

type NodeType = "trigger" | "email" | "wait" | "condition" | "action";

interface WfNode {
  id: string;
  type: NodeType;
  label: string;
  subtitle?: string;
  detail?: string;
  emailId?: string;          // maps to /api/email-preview/[id]
  x: number;
  y: number;
}

interface WfEdge {
  from: string;
  to: string;
  label?: string;
  dashed?: boolean;
}

/* ── Data ──────────────────────────────────────────── */

const NODES: WfNode[] = [
  // ── Parcours principal ──
  { id: "trigger_signup",   type: "trigger",    label: "Inscription",                subtitle: 'Événement "Signed Up"',                   x: 300, y: 0 },
  { id: "email_welcome",    type: "email",      label: "01 — Email de bienvenue",    subtitle: "Bienvenue sur Sorell",                     detail: "Confirmer adresse email\nBrief + thématiques enregistrés\nSources + destinataires configurés\nPremière newsletter en route", emailId: "01-welcome", x: 300, y: 120 },
  { id: "wait_1d",          type: "wait",       label: "Attendre 1 jour",            subtitle: "24h après inscription",                    x: 300, y: 300 },
  { id: "cond_config",      type: "condition",  label: "Newsletter configurée ?",                                                          x: 300, y: 410 },
  { id: "email_onboarding", type: "email",      label: "02 — Onboarding",            subtitle: "Votre veille vous attend",                 detail: "3 étapes rapides :\n1. Décrivez votre activité\n2. Choisissez vos thématiques\n3. Cliquez sur Générer", emailId: "02-onboarding-j1", x: 100, y: 530 },
  { id: "wait_14d",         type: "wait",       label: "Attendre 14 jours",          subtitle: "J+14 après inscription",                   x: 300, y: 640 },
  { id: "email_feedback",   type: "email",      label: "03 — Feedback",              subtitle: "2 semaines de veille",                     detail: "Sujets pertinents ?\nFréquence OK ?\nAméliorations ?\nPas de CTA — réponse par reply", emailId: "03-feedback-j14", x: 300, y: 760 },
  { id: "wait_28d",         type: "wait",       label: "Attendre 28 jours",          subtitle: "J+28 après inscription",                   x: 300, y: 940 },
  { id: "cond_plan",        type: "condition",  label: "Quel plan ?",                                                                      x: 300, y: 1050 },
  { id: "email_upsell",     type: "email",      label: "04 — Upsell",                subtitle: "1 mois avec Sorell",                       detail: "Plan Pro — 19€/mois\nNewsletters illimitées\n10 destinataires\nAnalytics + historique\nPas de pression", emailId: "04-upsell-j28", x: 100, y: 1170 },

  // ── Parcours Trial ──
  { id: "trigger_trial",    type: "trigger",    label: "Souscription Trial",         subtitle: "Essai Pro/Business 15j",                   x: 700, y: 0 },
  { id: "wait_trial_3",     type: "wait",       label: "J-3 avant fin",              subtitle: "12 jours après souscription",               x: 700, y: 120 },
  { id: "email_trial3",     type: "email",      label: "05 — Trial J-3",             subtitle: "Plus que 3 jours d'essai",                 detail: "Rappel fin d'essai\nAbonnement auto\nLien pour annuler\nCTA : Mon dashboard", emailId: "05-trial-j3", x: 700, y: 240 },
  { id: "wait_trial_1",     type: "wait",       label: "J-1 avant fin",              subtitle: "14 jours après souscription",               x: 700, y: 420 },
  { id: "email_trial1",     type: "email",      label: "06 — Trial J-1",             subtitle: "Dernier jour demain",                      detail: "Dernier rappel\nAbonnement auto demain\nLien pour annuler\nCTA : Gérer mon abonnement", emailId: "06-trial-j1", x: 700, y: 540 },
  { id: "wait_trial_0",     type: "wait",       label: "J0 — Fin de l'essai",        subtitle: "15 jours après souscription",               x: 700, y: 720 },
  { id: "email_trial0",     type: "email",      label: "07 — Abonnement actif",      subtitle: "Votre Pro est actif",                      detail: "Confirmation abonnement\nConfigurez sources\nAjoutez destinataires\nCTA : Mon dashboard", emailId: "07-trial-j0", x: 700, y: 840 },

  // ── Événements ──
  { id: "trigger_payment",  type: "trigger",    label: "Paiement échoué",            subtitle: "Webhook Stripe",                           x: 1100, y: 0 },
  { id: "email_payment",    type: "email",      label: "08 — Paiement échoué",       subtitle: "Problème de paiement",                     detail: "Compte basculé plan Gratuit\nConfigurations conservées\nMettre à jour paiement\nCTA : Portail Stripe", emailId: "08-payment-failed", x: 1100, y: 120 },

  { id: "trigger_limit",    type: "trigger",    label: "Limite atteinte",            subtitle: "CRON lifecycle",                           x: 1100, y: 320 },
  { id: "email_limit",      type: "email",      label: "09 — Limite atteinte",       subtitle: "Limite newsletters",                       detail: "1/1 newsletter utilisée (Free)\nProchaine le mois prochain\nPlan Business 49€/mois\nCTA : Voir les plans", emailId: "09-limit-reached", x: 1100, y: 440 },
];

const EDGES: WfEdge[] = [
  // Inscription flow
  { from: "trigger_signup",   to: "email_welcome" },
  { from: "email_welcome",    to: "wait_1d" },
  { from: "wait_1d",          to: "cond_config" },
  { from: "cond_config",      to: "email_onboarding", label: "Non" },
  { from: "cond_config",      to: "wait_14d",         label: "Oui" },
  { from: "email_onboarding", to: "wait_14d" },
  { from: "wait_14d",         to: "email_feedback" },
  { from: "email_feedback",   to: "wait_28d" },
  { from: "wait_28d",         to: "cond_plan" },
  { from: "cond_plan",        to: "email_upsell",     label: "Free" },
  { from: "cond_plan",        to: "wait_trial_3",     label: "Pro/Biz", dashed: true },

  // Trial flow
  { from: "trigger_trial",   to: "wait_trial_3" },
  { from: "wait_trial_3",    to: "email_trial3" },
  { from: "email_trial3",    to: "wait_trial_1" },
  { from: "wait_trial_1",    to: "email_trial1" },
  { from: "email_trial1",    to: "wait_trial_0" },
  { from: "wait_trial_0",    to: "email_trial0" },

  // Events
  { from: "trigger_payment", to: "email_payment" },
  { from: "trigger_limit",   to: "email_limit" },
];

/* ── Styles per node type ──────────────────────────── */

const TYPE_STYLES: Record<NodeType, { bg: string; border: string; icon: string; accent: string }> = {
  trigger:   { bg: "#ecfdf5", border: "#6ee7b7", icon: "⚡", accent: "#059669" },
  email:     { bg: "#ffffff", border: "#e5e7eb", icon: "📧", accent: "#005058" },
  wait:      { bg: "#fff7ed", border: "#fdba74", icon: "⏱", accent: "#c2410c"  },
  condition: { bg: "#f0f9ff", border: "#93c5fd", icon: "◇",  accent: "#2563eb" },
  action:    { bg: "#faf5ff", border: "#c4b5fd", icon: "⚙",  accent: "#7c3aed" },
};

const NODE_W = 260;
const NODE_HEIGHTS: Record<NodeType, number> = {
  trigger: 72,
  email: 160,
  wait: 64,
  condition: 56,
  action: 72,
};

/* ── Helpers ───────────────────────────────────────── */

function getNodeCenter(n: WfNode): { cx: number; cy: number } {
  const h = NODE_HEIGHTS[n.type];
  return { cx: n.x + NODE_W / 2, cy: n.y + h / 2 };
}

function getEdgePath(from: WfNode, to: WfNode): string {
  const fh = NODE_HEIGHTS[from.type];
  const th = NODE_HEIGHTS[to.type];

  // Start from bottom-center of "from", end at top-center of "to"
  let sx = from.x + NODE_W / 2;
  let sy = from.y + fh;
  let ex = to.x + NODE_W / 2;
  let ey = to.y;

  // If nodes are side-by-side, use right/left edges
  if (Math.abs(from.y - to.y) < 40) {
    if (from.x < to.x) {
      sx = from.x + NODE_W;
      sy = from.y + fh / 2;
      ex = to.x;
      ey = to.y + th / 2;
    } else {
      sx = from.x;
      sy = from.y + fh / 2;
      ex = to.x + NODE_W;
      ey = to.y + th / 2;
    }
    return `M ${sx} ${sy} C ${sx + 40} ${sy}, ${ex - 40} ${ey}, ${ex} ${ey}`;
  }

  // For condition → side node (Non/Oui branches)
  if (from.type === "condition" && Math.abs(ex - sx) > 80) {
    const midY = sy + (ey - sy) * 0.3;
    return `M ${sx} ${sy} L ${sx} ${midY} L ${ex} ${midY} L ${ex} ${ey}`;
  }

  // Default: smooth vertical curve
  const midY = (sy + ey) / 2;
  return `M ${sx} ${sy} C ${sx} ${midY}, ${ex} ${midY}, ${ex} ${ey}`;
}

/* ── Component ─────────────────────────────────────── */

export default function WorkflowPage() {
  const [selected, setSelected] = useState<WfNode | null>(null);

  const nodesById = Object.fromEntries(NODES.map((n) => [n.id, n]));

  // Canvas size
  const maxX = Math.max(...NODES.map((n) => n.x + NODE_W)) + 80;
  const maxY = Math.max(...NODES.map((n) => n.y + NODE_HEIGHTS[n.type])) + 80;

  return (
    <div className="flex h-[calc(100vh-64px)] animate-[fadeInUp_0.3s_ease-out]">
      {/* ── Canvas ── */}
      <div className="flex-1 overflow-auto bg-[var(--surface-alt)]" style={{ backgroundImage: "radial-gradient(circle, var(--border-subtle) 1px, transparent 1px)", backgroundSize: "24px 24px" }}>
        <div className="p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-[var(--text)]">Workflow Emails Lifecycle</h1>
            <p className="mt-1 text-sm text-[var(--text-muted)]">Cliquez sur un email pour voir son rendu exact</p>
          </div>

          <div className="relative" style={{ width: maxX, height: maxY }}>
            {/* SVG Arrows */}
            <svg className="absolute inset-0 pointer-events-none" width={maxX} height={maxY}>
              <defs>
                <marker id="arrow" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
                  <path d="M 0 0 L 8 3 L 0 6 Z" fill="#9ca3af" />
                </marker>
              </defs>
              {EDGES.map((e, i) => {
                const from = nodesById[e.from];
                const to = nodesById[e.to];
                if (!from || !to) return null;
                const path = getEdgePath(from, to);
                return (
                  <g key={i}>
                    <path
                      d={path}
                      fill="none"
                      stroke="#9ca3af"
                      strokeWidth={2}
                      strokeDasharray={e.dashed ? "6 4" : undefined}
                      markerEnd="url(#arrow)"
                    />
                    {e.label && (() => {
                      const fc = getNodeCenter(from);
                      const tc = getNodeCenter(to);
                      const lx = (fc.cx + tc.cx) / 2;
                      const ly = (fc.cy + tc.cy) / 2;
                      return (
                        <g>
                          <rect x={lx - 24} y={ly - 10} width={48} height={20} rx={4} fill="white" stroke="#e5e7eb" strokeWidth={1} />
                          <text x={lx} y={ly + 4} textAnchor="middle" fontSize={11} fontWeight={600} fill="#6b7280">{e.label}</text>
                        </g>
                      );
                    })()}
                  </g>
                );
              })}
            </svg>

            {/* Nodes */}
            {NODES.map((node) => {
              const style = TYPE_STYLES[node.type];
              const isSelected = selected?.id === node.id;
              const isClickable = node.type === "email";
              const h = NODE_HEIGHTS[node.type];

              return (
                <div
                  key={node.id}
                  onClick={() => isClickable && setSelected(node)}
                  className={`absolute rounded-xl border-2 transition-all duration-150 ${isClickable ? "cursor-pointer hover:shadow-lg hover:-translate-y-0.5" : ""} ${isSelected ? "ring-2 ring-offset-2 shadow-lg" : ""}`}
                  style={{
                    left: node.x,
                    top: node.y,
                    width: NODE_W,
                    height: h,
                    backgroundColor: style.bg,
                    borderColor: isSelected ? style.accent : style.border,
                    ringColor: style.accent,
                  }}
                >
                  {/* Header */}
                  <div className="flex items-center gap-2 px-3 pt-2.5">
                    <span className="text-sm">{style.icon}</span>
                    <span className="text-xs font-bold uppercase tracking-wide" style={{ color: style.accent }}>
                      {node.type === "email" ? "Send Email" : node.type === "wait" ? "Wait" : node.type === "condition" ? "Condition" : node.type === "trigger" ? "Event" : "Action"}
                    </span>
                    {isClickable && (
                      <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full text-white text-[10px]" style={{ backgroundColor: style.accent }}>↗</span>
                    )}
                  </div>

                  {/* Content */}
                  <div className="px-3 pt-1 pb-2">
                    <div className="text-sm font-semibold text-gray-900 leading-tight">{node.label}</div>
                    {node.subtitle && (
                      <div className="mt-0.5 text-[11px] text-gray-500 leading-tight">{node.subtitle}</div>
                    )}
                    {node.type === "email" && node.detail && (
                      <div className="mt-2 rounded-md bg-gray-50 px-2 py-1.5 text-[10px] text-gray-500 leading-relaxed whitespace-pre-line border border-gray-100" style={{ maxHeight: 60, overflow: "hidden" }}>
                        {node.detail}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Side Panel ── */}
      <div
        className={`border-l border-[var(--border)] bg-[var(--surface)] transition-all duration-300 flex flex-col ${selected ? "w-[520px]" : "w-0"}`}
        style={{ overflow: "hidden" }}
      >
        {selected && (
          <>
            <div className="flex items-center justify-between border-b border-[var(--border)] px-5 py-4 flex-shrink-0">
              <div>
                <div className="text-sm font-bold text-[var(--text)]">{selected.label}</div>
                <div className="text-xs text-[var(--text-muted)]">{selected.subtitle}</div>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-alt)] hover:text-[var(--text)]"
              >
                ✕
              </button>
            </div>

            {/* Email info */}
            <div className="border-b border-[var(--border)] px-5 py-3 flex-shrink-0">
              <div className="flex flex-wrap gap-2 text-[11px]">
                <span className="rounded-full bg-[var(--accent-subtle)] px-2.5 py-1 font-medium text-[var(--accent)]">
                  From: noreply@sorell.fr
                </span>
                <span className="rounded-full bg-gray-100 px-2.5 py-1 font-medium text-gray-600">
                  Reply-to: noe@sorell.fr
                </span>
                <span className="rounded-full bg-gray-100 px-2.5 py-1 font-medium text-gray-600">
                  Template: emails/{selected.emailId?.replace(/\d+-/, "")}.tsx
                </span>
              </div>
            </div>

            {/* Email preview */}
            <div className="flex-1 overflow-hidden bg-gray-100 p-4">
              <div className="h-full rounded-lg border border-gray-200 bg-white overflow-hidden shadow-sm">
                {selected.emailId ? (
                  <iframe
                    key={selected.emailId}
                    src={`/api/email-preview/${selected.emailId}`}
                    className="h-full w-full border-0"
                    title={`Aperçu: ${selected.label}`}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-gray-400">
                    Pas d&apos;aperçu disponible
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
