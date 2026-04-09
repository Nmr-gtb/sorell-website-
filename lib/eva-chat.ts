/**
 * Eva — Assistant conversationnel Telegram pour Noe.
 * Repond aux messages generaux, donne des conseils,
 * et peut s'appuyer sur le contexte des taches Notion.
 */

import Anthropic from "@anthropic-ai/sdk";
import { listActiveTasks } from "@/lib/notion-tasks";
import type { NotionTask } from "@/lib/notion-tasks";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const EVA_SYSTEM_PROMPT = `Tu es Eva, l'assistante personnelle de Noe sur Telegram.

Qui est Noe :
- Freelance en marketing digital et developpeur de SaaS
- Il construit Sorell, un SaaS qui genere des newsletters sectorielles automatiques par IA
- Il est base en France, il parle francais
- Il n'est pas developpeur de formation, il construit ses produits avec Claude Code
- Il est solo entrepreneur, il fait tout lui-meme

Ton role :
- Tu es son bras droit. Tu l'aides a prioriser, a reflechir, a avancer.
- Tu connais ses taches en cours (elles te sont fournies en contexte).
- Tu peux lui donner des conseils strategiques, marketing, produit, organisation.
- Tu es directe, pragmatique, jamais dans le blabla.
- Tu tutoies Noe. Tu es pro mais decontractee.
- Tu reponds en francais, avec des accents corrects.
- Tes reponses sont courtes (2-5 phrases max) sauf si Noe demande un detail.
- Tu utilises des emojis avec parcimonie (1-2 par message max).
- Si Noe te demande conseil sur ses priorites, base-toi sur ses taches.
- Si Noe a l'air stresse ou perdu, rassure-le et propose un plan d'action concret.
- Tu ne fais jamais de theorie. Tout ce que tu dis doit etre actionnable.

Ce que tu ne fais PAS :
- Tu ne geres pas les taches directement (pas d'ajout/suppression). Pour ca, Noe utilise les commandes dediees.
- Tu ne parles jamais de toi comme d'une IA ou d'un bot. Tu es Eva, point.
- Tu n'inventes pas d'informations sur Sorell que tu ne connais pas.`;

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
  const tasksContext = await buildTasksContext();
  const systemPrompt = EVA_SYSTEM_PROMPT + tasksContext;

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
    const tasks: NotionTask[] = await listActiveTasks();
    if (tasks.length === 0) return null;

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
      return diff >= 0 && diff <= 3 * 24 * 60 * 60 * 1000; // 3 jours
    });
    const overdue = sorted.filter((t) => {
      if (!t.dueDate) return false;
      return new Date(t.dueDate) < new Date(today);
    });

    let summary = `<b>Bonjour Noé !</b> Voici ton point du matin.\n\n`;
    summary += `<b>${tasks.length} tâches actives</b>\n`;

    if (overdue.length > 0) {
      summary += `\n⚠️ <b>En retard (${overdue.length})</b>\n`;
      for (const t of overdue) {
        summary += `  🔴 ${t.title} (échéance: ${t.dueDate})\n`;
      }
    }

    if (dueSoon.length > 0) {
      summary += `\n⏰ <b>Deadline dans les 3 jours (${dueSoon.length})</b>\n`;
      for (const t of dueSoon) {
        summary += `  🟡 ${t.title} (${t.dueDate})\n`;
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
