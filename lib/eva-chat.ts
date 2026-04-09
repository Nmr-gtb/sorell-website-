/**
 * Eva — Assistant conversationnel Telegram pour Noe.
 * Repond aux messages generaux, donne des conseils,
 * et peut s'appuyer sur le contexte des taches Notion.
 */

import Anthropic from "@anthropic-ai/sdk";
import { listActiveTasks } from "@/lib/notion-tasks";
import type { NotionTask } from "@/lib/notion-tasks";
import { getBusinessContext } from "@/lib/eva-stats";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const EVA_SYSTEM_PROMPT = `Tu es Eva, le bras droit de Noé. Tu lui parles sur Telegram comme une vraie collègue de confiance.

Qui est Noé :
- Freelance marketing digital, solo entrepreneur basé en France
- Il construit Sorell, un SaaS de newsletters automatiques par IA
- Il n'est PAS dev de formation — il construit tout avec Claude Code
- Il gère tout seul : produit, marketing, ventes, technique, stratégie

Comment tu lui parles :
- Comme une pote pro. Tu tutoies, tu es directe, zéro blabla.
- Tu parles SIMPLE. Pas de jargon technique sauf si Noé en utilise.
- Réponses courtes : 2-4 phrases. Comme un vrai message Telegram entre humains.
- Si Noé pose une question, tu réponds à la question. Pas de détour.
- Si Noé hésite, tu tranches. Tu donnes TON avis, pas 3 options molles.
- Si Noé est stressé ou perdu, tu le recadres calmement avec un plan concret.
- Tu ne fais jamais de liste à puces sauf si c'est un plan d'action.
- Un emoji de temps en temps, naturellement, pas en mode robot.
- Tu réponds en français, avec tous les accents.

Ton expertise :
- Stratégie business, marketing, priorisation, organisation
- Tu connais ses tâches Notion (fournies en contexte) et tu t'en sers pour le conseiller
- Tu peux challenger ses idées. Tu n'es pas une yes-woman.
- Tout ce que tu dis doit être actionnable. Zéro théorie.

Ce que tu ne fais PAS :
- Tu ne gères pas les tâches (pas d'ajout/suppression). Pour ça il y a les commandes.
- Tu ne parles jamais de toi comme d'une IA. Tu es Eva.
- Tu n'inventes rien sur Sorell que tu ne connais pas.
- Tu ne fais JAMAIS de réponses longues ou de pavés. Court et percutant.`;

/**
 * Construit le contexte des tâches Notion.
 */
async function buildTasksContext(): Promise<string> {
  try {
    const tasks: NotionTask[] = await listActiveTasks();
    if (tasks.length === 0) return "\n\nNoé n'a aucune tâche en cours pour le moment.";

    let ctx = `\n\nTâches en cours de Noé (${tasks.length}) :\n`;
    const priorityOrder: Record<string, number> = { Haute: 1, Moyenne: 2, Basse: 3 };
    const sorted = [...tasks].sort(
      (a, b) => (priorityOrder[a.priority] ?? 99) - (priorityOrder[b.priority] ?? 99)
    );
    for (const task of sorted) {
      const status = task.status === "En cours" ? "🔄" : "⬜";
      const prio = task.priority === "Haute" ? "🔴" : task.priority === "Basse" ? "🟢" : "🟡";
      ctx += `${status} ${prio} ${task.title}`;
      if (task.dueDate) ctx += ` (échéance: ${task.dueDate})`;
      if (task.notes) ctx += ` — ${task.notes}`;
      ctx += "\n";
    }
    return ctx;
  } catch {
    return "\n\n(Impossible de charger les tâches Notion pour le moment.)";
  }
}

/**
 * Génère une réponse conversationnelle d'Eva.
 * Supporte le multi-turn avec historique de conversation.
 */
export async function generateEvaResponse(
  message: string,
  history: ChatMessage[] = []
): Promise<string> {
  const [tasksContext, businessContext] = await Promise.all([
    buildTasksContext(),
    getBusinessContext(),
  ]);
  const systemPrompt = EVA_SYSTEM_PROMPT + tasksContext + businessContext;

  // Construire les messages avec historique
  const messages = [
    ...history.map((msg) => ({
      role: msg.role as "user" | "assistant",
      content: msg.content,
    })),
    { role: "user" as const, content: message },
  ];

  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 500,
    system: systemPrompt,
    messages,
  });

  const text = response.content[0]?.type === "text" ? response.content[0].text : "";
  return text || "Hmm, j'ai eu un bug. Réessaie ?";
}

/**
 * Génère le résumé quotidien des tâches pour le CRON matin.
 */
export async function generateDailySummary(): Promise<string | null> {
  try {
    const [tasks, businessCtx] = await Promise.all([
      listActiveTasks(),
      getBusinessContext(),
    ]);

    const today = new Date().toISOString().split("T")[0];
    const priorityOrder: Record<string, number> = { Haute: 1, Moyenne: 2, Basse: 3 };
    const sorted = [...tasks].sort(
      (a, b) => (priorityOrder[a.priority] ?? 99) - (priorityOrder[b.priority] ?? 99)
    );

    const highPriority = sorted.filter((t) => t.priority === "Haute");
    const inProgress = sorted.filter((t) => t.status === "En cours");
    const dueSoon = sorted.filter((t) => {
      if (!t.dueDate) return false;
      const diff = new Date(t.dueDate).getTime() - new Date(today).getTime();
      return diff >= 0 && diff <= 3 * 24 * 60 * 60 * 1000;
    });
    const overdue = sorted.filter((t) => {
      if (!t.dueDate) return false;
      return new Date(t.dueDate) < new Date(today);
    });

    let summary = `<b>Bonjour Noé !</b> Voici ton point du matin.\n`;

    // Business metrics
    if (businessCtx) {
      summary += `\n📊 ${businessCtx.trim()}\n`;
    }

    // Tasks
    if (tasks.length > 0) {
      summary += `\n<b>${tasks.length} tâches actives</b>\n`;
    }

    if (overdue.length > 0) {
      summary += `\n⚠️ <b>En retard (${overdue.length})</b>\n`;
      for (const t of overdue) {
        summary += `  ${t.title} (${t.dueDate})\n`;
      }
    }

    if (dueSoon.length > 0) {
      summary += `\n⏰ <b>Deadline proche (${dueSoon.length})</b>\n`;
      for (const t of dueSoon) {
        summary += `  ${t.title} (${t.dueDate})\n`;
      }
    }

    if (highPriority.length > 0) {
      summary += `\n🔴 <b>Priorité haute (${highPriority.length})</b>\n`;
      for (const t of highPriority) {
        const icon = t.status === "En cours" ? "🔄" : "⬜";
        summary += `  ${icon} ${t.title}\n`;
      }
    }

    if (inProgress.length > 0) {
      summary += `\n🔄 <b>En cours (${inProgress.length})</b>\n`;
      for (const t of inProgress) {
        summary += `  ${t.title}\n`;
      }
    }

    summary += `\nBonne journée !`;

    return summary;
  } catch {
    return null;
  }
}

/**
 * Vérifie les tâches avec deadline et retourne les alertes.
 */
export async function checkDeadlineAlerts(): Promise<string | null> {
  try {
    const tasks: NotionTask[] = await listActiveTasks();
    const today = new Date().toISOString().split("T")[0];

    const overdue = tasks.filter((t) => {
      if (!t.dueDate) return false;
      return new Date(t.dueDate) < new Date(today);
    });

    const dueToday = tasks.filter((t) => t.dueDate === today);

    const dueTomorrow = tasks.filter((t) => {
      if (!t.dueDate) return false;
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      return t.dueDate === tomorrow.toISOString().split("T")[0];
    });

    if (overdue.length === 0 && dueToday.length === 0 && dueTomorrow.length === 0) {
      return null;
    }

    let alert = "";

    if (overdue.length > 0) {
      alert += `⚠️ <b>${overdue.length} tâche(s) en retard !</b>\n`;
      for (const t of overdue) {
        alert += `  🔴 ${t.title} (était prévue le ${t.dueDate})\n`;
      }
      alert += "\n";
    }

    if (dueToday.length > 0) {
      alert += `📅 <b>${dueToday.length} tâche(s) pour aujourd'hui</b>\n`;
      for (const t of dueToday) {
        alert += `  🟡 ${t.title}\n`;
      }
      alert += "\n";
    }

    if (dueTomorrow.length > 0) {
      alert += `⏰ <b>${dueTomorrow.length} tâche(s) pour demain</b>\n`;
      for (const t of dueTomorrow) {
        alert += `  🔵 ${t.title}\n`;
      }
    }

    return alert.trim();
  } catch {
    return null;
  }
}
