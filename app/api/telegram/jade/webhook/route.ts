/**
 * Webhook Telegram — Bot QA/Monitoring Jade pour Sorell.
 *
 * Variables d'environnement requises :
 * - TELEGRAM_JADE_BOT_TOKEN : token du bot Jade (BotFather)
 * - TELEGRAM_JADE_WEBHOOK_SECRET : secret dans l'URL pour vérifier les requêtes
 * - TELEGRAM_USER_ID : ID Telegram de Noé (partagé avec Eva)
 * - ANTHROPIC_API_KEY : clé API Anthropic (partagée)
 */

import { NextResponse } from "next/server";
import type { TelegramUpdate } from "@/lib/telegram-bot";
import { sendTelegramMessage, getBotToken } from "@/lib/telegram-bot";
import { parseJadeIntent } from "@/lib/jade-parser";
import type { JadeIntent } from "@/lib/jade-parser";
import { generateJadeResponse } from "@/lib/jade-chat";
import { saveMessage, loadHistory } from "@/lib/telegram-history";
import {
  runFullReview,
  runContactTest,
  runQuickCheck,
  checkChatApi,
  checkMainPages,
  checkCronEndpoint,
  checkStripeWebhook,
  checkAuth,
  checkNewsletter,
  checkLifecycleCron,
} from "@/lib/eva-monitor";

export const maxDuration = 60;

// --- Helpers ---

function isAuthorizedUser(userId: number): boolean {
  const allowedId = process.env.TELEGRAM_USER_ID;
  if (!allowedId) return false;
  return userId === parseInt(allowedId, 10);
}

function verifyWebhookSecret(request: Request): boolean {
  const url = new URL(request.url);
  const secret = url.searchParams.get("secret");
  const expectedSecret = process.env.TELEGRAM_JADE_WEBHOOK_SECRET;
  if (!expectedSecret) return false;
  return secret === expectedSecret;
}

// --- Formatters ---

function formatCheckResult(check: { name: string; ok: boolean; detail?: string }): string {
  const icon = check.ok ? "✅" : "❌";
  return `${icon} <b>${check.name}</b> — ${check.detail}`;
}

// --- Intent handlers ---

async function handleCheckChat(): Promise<string> {
  const result = await checkChatApi();
  if (result.ok) {
    return `L'API Chat (Soly) fonctionne. Réponse en ${result.responseTime}ms.`;
  }
  return `⚠️ L'API Chat a un problème.\nStatus: ${result.status}\nDétail: ${result.detail}`;
}

async function handleCheckPages(): Promise<string> {
  const pages = await checkMainPages();
  const passed = pages.filter((p) => p.ok).length;
  let report = `<b>Test des pages</b> — ${passed}/${pages.length} OK\n\n`;
  for (const page of pages) {
    report += formatCheckResult(page) + "\n";
  }
  return report;
}

async function handleCheckCron(): Promise<string> {
  const result = await checkCronEndpoint();
  if (result.ok) {
    return `Le CRON endpoint est opérationnel et protégé. Réponse en ${result.responseTime}ms.`;
  }
  return `⚠️ Le CRON endpoint a un problème.\nStatus: ${result.status}\nDétail: ${result.detail}`;
}

async function handleCheckStripe(): Promise<string> {
  const result = await checkStripeWebhook();
  if (result.ok) {
    return `Le webhook Stripe est opérationnel et protégé. Réponse en ${result.responseTime}ms.`;
  }
  return `⚠️ Le webhook Stripe a un problème.\nStatus: ${result.status}\nDétail: ${result.detail}`;
}

async function handleCheckAuth(): Promise<string> {
  const result = await checkAuth();
  if (result.ok) {
    return `L'authentification Supabase fonctionne. ${result.detail}`;
  }
  return `⚠️ L'authentification a un problème.\nStatus: ${result.status}\nDétail: ${result.detail}`;
}

async function handleCheckNewsletter(): Promise<string> {
  const result = await checkNewsletter();
  if (result.ok) {
    return `L'API Newsletter fonctionne et est protégée. Réponse en ${result.responseTime}ms.`;
  }
  return `⚠️ L'API Newsletter a un problème.\nStatus: ${result.status}\nDétail: ${result.detail}`;
}

async function handleCheckLifecycle(): Promise<string> {
  const result = await checkLifecycleCron();
  if (result.ok) {
    return `Le CRON Lifecycle est opérationnel. Réponse en ${result.responseTime}ms.`;
  }
  return `⚠️ Le CRON Lifecycle a un problème.\nStatus: ${result.status}\nDétail: ${result.detail}`;
}

/**
 * Exécute l'intent de Jade et retourne le message de réponse.
 */
async function executeIntent(intent: JadeIntent, chatId: number): Promise<string> {
  switch (intent.intent) {
    case "full_review":
      return runFullReview();
    case "check_site":
      return runQuickCheck();
    case "check_contact":
      return runContactTest();
    case "check_chat":
      return handleCheckChat();
    case "check_pages":
      return handleCheckPages();
    case "check_cron":
      return handleCheckCron();
    case "check_stripe":
      return handleCheckStripe();
    case "check_auth":
      return handleCheckAuth();
    case "check_newsletter":
      return handleCheckNewsletter();
    case "check_lifecycle":
      return handleCheckLifecycle();
    case "conversation": {
      const history = await loadHistory("jade", chatId);
      return generateJadeResponse(intent.rawMessage, history);
    }
    case "unknown": {
      const history = await loadHistory("jade", chatId);
      return generateJadeResponse(intent.rawMessage, history);
    }
  }
}

// --- Route handler ---

export async function POST(request: Request): Promise<Response> {
  const jadeToken = getBotToken("jade");

  try {
    if (!verifyWebhookSecret(request)) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const update = (await request.json()) as TelegramUpdate;

    if (!update.message?.text || !update.message.from) {
      return NextResponse.json({ ok: true });
    }

    const { message } = update;
    const chatId = message.chat.id;
    const userId = message.from?.id;
    const text = message.text as string;

    if (!userId || !isAuthorizedUser(userId)) {
      await sendTelegramMessage({
        chatId,
        text: "Accès refusé. Ce bot est réservé.",
        botToken: jadeToken,
      });
      return NextResponse.json({ ok: true });
    }

    // Commande /start
    if (text === "/start") {
      await sendTelegramMessage({
        chatId,
        text: "Salut Noé ! Jade est là, prête à tester.\n\nVoici ce que je peux faire :\n\n<b>Monitoring :</b>\n- \"fullreview\" — Check complet (9 checks)\n- \"le site est up ?\" — Vérification rapide\n- \"teste le contact\" — Test formulaire\n- \"check soly\" — Test API chat\n- \"check les pages\" — Test toutes les pages\n- \"check le cron\" — Test CRON endpoint\n- \"check stripe\" — Test webhook Stripe\n- \"check auth\" — Test authentification\n- \"check newsletter\" — Test API génération\n- \"check lifecycle\" — Test CRON lifecycle\n\nJe te préviens aussi automatiquement si le site tombe.",
        botToken: jadeToken,
      });
      return NextResponse.json({ ok: true });
    }

    // Sauvegarder le message utilisateur
    await saveMessage({ botName: "jade", chatId, role: "user", content: text });

    // Parser l'intent via Claude Haiku
    const intent = await parseJadeIntent(text);

    // Exécuter le check correspondant
    const reply = await executeIntent(intent, chatId);

    // Sauvegarder la réponse
    await saveMessage({
      botName: "jade",
      chatId,
      role: "assistant",
      content: reply,
      intent: intent.intent,
    });

    // Répondre sur Telegram
    await sendTelegramMessage({ chatId, text: reply, botToken: jadeToken });

    return NextResponse.json({ ok: true });
  } catch (error) {
    try {
      const body = (await request.clone().json()) as TelegramUpdate;
      const chatId = body.message?.chat.id;
      if (chatId) {
        await sendTelegramMessage({
          chatId,
          text: "Erreur technique. Réessaie dans un instant.",
          botToken: jadeToken,
        });
      }
    } catch {
      // Impossible de répondre
    }

    if (process.env.NODE_ENV === "development") {
      const errorMessage = error instanceof Error ? error.message : "Erreur inconnue";
      return NextResponse.json({ error: errorMessage }, { status: 500 });
    }

    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
