/**
 * Eva — Assistant conversationnel Telegram pour Noe.
 * Repond aux messages generaux, donne des conseils,
 * et peut s'appuyer sur le contexte des taches Notion.
 */

import Anthropic from "@anthropic-ai/sdk";
import { listActiveTasks, formatTaskList } from "@/lib/notion-tasks";
import type { NotionTask } from "@/lib/notion-tasks";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

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
 * Genere une reponse conversationnelle d'Eva.
 * Inclut le contexte des taches Notion si disponible.
 */
export async function generateEvaResponse(message: string): Promise<string> {
  let tasksContext = "";

  try {
    const tasks: NotionTask[] = await listActiveTasks();
    if (tasks.length > 0) {
      tasksContext = `\n\nTaches en cours de Noe (${tasks.length}) :\n`;
      const priorityOrder: Record<string, number> = { Haute: 1, Moyenne: 2, Basse: 3 };
      const sorted = [...tasks].sort(
        (a, b) => (priorityOrder[a.priority] ?? 99) - (priorityOrder[b.priority] ?? 99)
      );
      for (const task of sorted) {
        const status = task.status === "En cours" ? "🔄" : "⬜";
        const prio = task.priority === "Haute" ? "🔴" : task.priority === "Basse" ? "🟢" : "🟡";
        tasksContext += `${status} ${prio} ${task.title}`;
        if (task.dueDate) tasksContext += ` (echeance: ${task.dueDate})`;
        if (task.notes) tasksContext += ` — ${task.notes}`;
        tasksContext += "\n";
      }
    } else {
      tasksContext = "\n\nNoe n'a aucune tache en cours pour le moment.";
    }
  } catch {
    tasksContext = "\n\n(Impossible de charger les taches Notion pour le moment.)";
  }

  const systemPrompt = EVA_SYSTEM_PROMPT + tasksContext;

  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 500,
    system: systemPrompt,
    messages: [
      {
        role: "user",
        content: message,
      },
    ],
  });

  const text = response.content[0]?.type === "text" ? response.content[0].text : "";
  return text || "Hmm, j'ai eu un bug. Reessaie ?";
}
