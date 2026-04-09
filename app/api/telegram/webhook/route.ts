/**
 * Webhook Telegram - Bot de gestion de taches Notion pour Sorell.
 *
 * Variables d'environnement requises :
 * - TELEGRAM_BOT_TOKEN : token du bot (BotFather)
 * - TELEGRAM_WEBHOOK_SECRET : secret dans l'URL pour verifier les requetes
 * - TELEGRAM_USER_ID : ID Telegram de Noe (nombre)
 * - NOTION_API_KEY : token d'integration interne Notion
 * - NOTION_DATABASE_ID : ID de la database "Taches Sorell"
 * - ANTHROPIC_API_KEY : cle API Anthropic (deja existante)
 */

import { NextResponse } from "next/server";
import type { TelegramUpdate } from "@/lib/telegram-bot";
import { sendTelegramMessage } from "@/lib/telegram-bot";
import { parseTaskIntent } from "@/lib/task-parser";
import type { TaskIntent } from "@/lib/task-parser";
import {
  createTask,
  searchTasks,
  listActiveTasks,
  updateTaskStatus,
  updateTaskFields,
  archiveTask,
  formatTaskList,
} from "@/lib/notion-tasks";
import type { NotionTask } from "@/lib/notion-tasks";
import { generateEvaResponse } from "@/lib/eva-chat";
import { saveMessage, loadHistory } from "@/lib/telegram-history";
import {
  getBusinessOverview,
  getSignupStats,
  getMRRStats,
  getConversionStats,
  getChurnStats,
  getInactiveUsers,
  getUserInfo,
} from "@/lib/eva-stats";

// --- Helpers ---

function isAuthorizedUser(userId: number): boolean {
  const allowedId = process.env.TELEGRAM_USER_ID;
  if (!allowedId) return false;
  return userId === parseInt(allowedId, 10);
}

function verifyWebhookSecret(request: Request): boolean {
  const url = new URL(request.url);
  const secret = url.searchParams.get("secret");
  const expectedSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!expectedSecret) return false;
  return secret === expectedSecret;
}

/**
 * Trouve la tache la plus pertinente par recherche fuzzy.
 * Retourne null si aucune tache trouvee.
 */
async function findTaskByQuery(query: string): Promise<NotionTask | null> {
  const tasks = await searchTasks(query);
  if (tasks.length > 0) return tasks[0];

  // Tentative avec des mots individuels si la recherche complete echoue
  const words = query.split(" ").filter((w) => w.length > 2);
  for (const word of words) {
    const results = await searchTasks(word);
    if (results.length > 0) return results[0];
  }

  return null;
}

// --- Intent handlers ---

async function handleAddTask(intent: Extract<TaskIntent, { intent: "add_task" }>): Promise<string> {
  const task = await createTask({
    title: intent.title,
    priority: intent.priority,
    notes: intent.notes,
    dueDate: intent.dueDate,
  });

  let reply = `C'est noté ✅ <b>${task.title}</b>`;
  if (task.priority === "Haute") reply += ` — priorité haute 🔴`;
  if (task.dueDate) reply += `\nÉchéance : ${task.dueDate}`;
  if (task.notes) reply += `\n${task.notes}`;
  return reply;
}

async function handleMarkDone(
  intent: Extract<TaskIntent, { intent: "mark_done" }>
): Promise<string> {
  const task = await findTaskByQuery(intent.searchQuery);
  if (!task) return `J'ai pas trouvé de tâche pour "${intent.searchQuery}" 🤔`;

  await updateTaskStatus(task.id, "Terminé");
  return `<b>${task.title}</b> terminée, bien joué 🎉`;
}

async function handleMarkInProgress(
  intent: Extract<TaskIntent, { intent: "mark_in_progress" }>
): Promise<string> {
  const task = await findTaskByQuery(intent.searchQuery);
  if (!task) return `J'ai pas trouvé de tâche pour "${intent.searchQuery}" 🤔`;

  await updateTaskStatus(task.id, "En cours");
  return `<b>${task.title}</b> passée en cours 🔄`;
}

async function handleListTasks(
  intent: Extract<TaskIntent, { intent: "list_tasks" }>
): Promise<string> {
  const tasks = await listActiveTasks();

  if (intent.filterPriority) {
    const filtered = tasks.filter((t) => t.priority === intent.filterPriority);
    return formatTaskList(filtered);
  }

  return formatTaskList(tasks);
}

async function handleUpdateTask(
  intent: Extract<TaskIntent, { intent: "update_task" }>
): Promise<string> {
  const task = await findTaskByQuery(intent.searchQuery);
  if (!task) return `J'ai pas trouvé de tâche pour "${intent.searchQuery}" 🤔`;

  const updated = await updateTaskFields(task.id, {
    priority: intent.priority,
    notes: intent.notes,
    dueDate: intent.dueDate,
  });

  let reply = `<b>${updated.title}</b> mise à jour 👌`;
  if (intent.priority) reply += `\nPriorité : ${updated.priority}`;
  if (intent.notes) reply += `\n${updated.notes}`;
  if (intent.dueDate) reply += `\nÉchéance : ${updated.dueDate}`;
  return reply;
}

async function handleDeleteTask(
  intent: Extract<TaskIntent, { intent: "delete_task" }>
): Promise<string> {
  const task = await findTaskByQuery(intent.searchQuery);
  if (!task) return `J'ai pas trouvé de tâche pour "${intent.searchQuery}" 🤔`;

  await archiveTask(task.id);
  return `<b>${task.title}</b> archivée 🗑️`;
}

/**
 * Execute l'intent et retourne le message de reponse.
 */
async function executeIntent(intent: TaskIntent, chatId: number): Promise<string> {
  switch (intent.intent) {
    case "add_task":
      return handleAddTask(intent);
    case "mark_done":
      return handleMarkDone(intent);
    case "mark_in_progress":
      return handleMarkInProgress(intent);
    case "list_tasks":
      return handleListTasks(intent);
    case "update_task":
      return handleUpdateTask(intent);
    case "delete_task":
      return handleDeleteTask(intent);
    case "business_overview":
      return getBusinessOverview();
    case "stats_signups":
      return getSignupStats();
    case "stats_mrr":
      return getMRRStats();
    case "stats_conversion":
      return getConversionStats();
    case "stats_churn":
      return getChurnStats();
    case "stats_inactive":
      return getInactiveUsers();
    case "user_lookup":
      return getUserInfo(intent.searchQuery);
    case "conversation": {
      const history = await loadHistory("eva", chatId);
      return generateEvaResponse(intent.rawMessage, history);
    }
    case "unknown": {
      const history = await loadHistory("eva", chatId);
      return generateEvaResponse(intent.rawMessage, history);
    }
  }
}

// --- Route handler ---

export async function POST(request: Request): Promise<Response> {
  try {
    // Verification du secret dans l'URL
    if (!verifyWebhookSecret(request)) {
      return NextResponse.json({ error: "Non autorise" }, { status: 401 });
    }

    const update = (await request.json()) as TelegramUpdate;

    // Ignorer les updates sans message texte
    if (!update.message?.text || !update.message.from) {
      return NextResponse.json({ ok: true });
    }

    const { message } = update;
    const chatId = message.chat.id;
    const userId = message.from?.id;
    const text = message.text as string; // Garanti non-undefined par le check ci-dessus

    // Verification que l'expediteur est Noe
    if (!userId || !isAuthorizedUser(userId)) {
      await sendTelegramMessage({
        chatId,
        text: "Acces refuse. Ce bot est reserve.",
      });
      return NextResponse.json({ ok: true });
    }

    // Commande /start
    if (text === "/start") {
      await sendTelegramMessage({
        chatId,
        text: "Salut Noé ! Eva est là.\n\nTu peux me parler normalement, je comprends tout.\n\n<b>Business :</b>\n- \"Stats\" ou \"Dashboard\" — vue d'ensemble\n- \"MRR\" — revenus\n- \"Inscrits\" — dernières inscriptions\n- \"Conversion\" — taux trial → payant\n- \"Churn\" — désabonnements\n- \"Inactifs\" — users qui n'utilisent pas\n- \"Info sur [email]\" — fiche utilisateur\n\n<b>Tâches :</b>\n- \"Ajoute : [tâche]\"\n- \"Termine [tâche]\"\n- \"Mes tâches\"\n\n<b>Discussion :</b>\nConseils, priorisation, stratégie — je connais tes tâches et tes metrics.\n\nPour le monitoring, utilise Jade.",
      });
      return NextResponse.json({ ok: true });
    }

    // Sauvegarder le message utilisateur
    await saveMessage({ botName: "eva", chatId, role: "user", content: text });

    // Parser l'intent via Claude Haiku
    const intent = await parseTaskIntent(text);

    // Exécuter l'action Notion correspondante
    const reply = await executeIntent(intent, chatId);

    // Sauvegarder la réponse
    await saveMessage({
      botName: "eva",
      chatId,
      role: "assistant",
      content: reply,
      intent: intent.intent,
    });

    // Répondre sur Telegram
    await sendTelegramMessage({ chatId, text: reply });

    return NextResponse.json({ ok: true });
  } catch (error) {
    // Tenter de repondre a l'utilisateur en cas d'erreur
    try {
      const body = (await request.clone().json()) as TelegramUpdate;
      const chatId = body.message?.chat.id;
      if (chatId) {
        await sendTelegramMessage({
          chatId,
          text: "Oups, petit bug de mon côté 😅 Réessaie dans un instant.",
        });
      }
    } catch {
      // Impossible de repondre, on continue
    }

    // Log serveur uniquement
    if (process.env.NODE_ENV === "development") {
      const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
      return NextResponse.json({ error: errorMessage }, { status: 500 });
    }

    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
