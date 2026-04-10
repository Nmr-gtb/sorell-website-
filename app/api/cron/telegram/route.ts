/**
 * CRON Telegram — Messages proactifs pour Eva et Jade.
 *
 * Appelé par cron-job.org toutes les 15 minutes.
 * GET /api/cron/telegram?secret=CRON_SECRET
 *
 * Actions :
 * 1. Site down → Jade alerte immédiatement
 * 2. Résumé quotidien → Eva envoie à 8h (heure Paris)
 * 3. Rappels deadline → Eva alerte à 9h si tâches en retard ou deadline aujourd'hui
 * 4. Rapport hebdo Jade → dimanche 9h
 * 5. Alertes business → 10h
 * 6. Sync Notion → 11h (utilisateurs + activités pendantes)
 * 7. Rappels planning communication → toutes les 15 min (24h, 1h, à l'heure)
 */

import { NextResponse } from "next/server";
import { sendTelegramMessage, getBotToken } from "@/lib/telegram-bot";
import { checkSiteUp, runWeeklyReport } from "@/lib/eva-monitor";
import { generateDailySummary, checkDeadlineAlerts } from "@/lib/eva-chat";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { checkBusinessAlerts } from "@/lib/eva-stats";
import { syncAllUsersToNotion, syncPendingActivities } from "@/lib/notion-sync";
import { checkPlanningReminders } from "@/lib/eva-planning";

export const maxDuration = 60;

// --- Auth ---

function verifyCronSecret(request: Request): boolean {
  const url = new URL(request.url);
  const secret = url.searchParams.get("secret");
  // Support Bearer header too (consistent with /api/cron)
  const authHeader = request.headers.get("authorization");
  const bearerSecret = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  return (secret === process.env.CRON_SECRET) || (bearerSecret === process.env.CRON_SECRET);
}

function getChatId(): number {
  const id = process.env.TELEGRAM_USER_ID;
  if (!id) throw new Error("TELEGRAM_USER_ID manquant");
  return parseInt(id, 10);
}

// --- State tracking (éviter les alertes en boucle) ---

interface CronState {
  lastSiteDownAlert: string | null; // ISO timestamp
  lastDailySummary: string | null; // YYYY-MM-DD
  lastDeadlineAlert: string | null; // YYYY-MM-DD
  lastBusinessAlert: string | null; // YYYY-MM-DD
  lastWeeklyReport: string | null; // YYYY-MM-DD
  lastNotionSync: string | null; // YYYY-MM-DD
}

async function getCronState(): Promise<CronState> {
  const { data } = await supabaseAdmin
    .from("telegram_messages")
    .select("intent, created_at")
    .in("intent", ["cron_site_down", "cron_daily_summary", "cron_deadline_alert", "cron_business_alert", "cron_weekly_report", "cron_notion_sync", "cron_planning_reminder"])
    .order("created_at", { ascending: false })
    .limit(10);

  const state: CronState = {
    lastSiteDownAlert: null,
    lastDailySummary: null,
    lastDeadlineAlert: null,
    lastBusinessAlert: null,
    lastWeeklyReport: null,
    lastNotionSync: null,
  };

  if (!data) return state;

  for (const msg of data) {
    const date = msg.created_at?.split("T")[0];
    if (msg.intent === "cron_site_down" && !state.lastSiteDownAlert) {
      state.lastSiteDownAlert = msg.created_at;
    }
    if (msg.intent === "cron_daily_summary" && !state.lastDailySummary) {
      state.lastDailySummary = date;
    }
    if (msg.intent === "cron_deadline_alert" && !state.lastDeadlineAlert) {
      state.lastDeadlineAlert = date;
    }
    if (msg.intent === "cron_business_alert" && !state.lastBusinessAlert) {
      state.lastBusinessAlert = date;
    }
    if (msg.intent === "cron_weekly_report" && !state.lastWeeklyReport) {
      state.lastWeeklyReport = date;
    }
    if (msg.intent === "cron_notion_sync" && !state.lastNotionSync) {
      state.lastNotionSync = date;
    }
  }

  return state;
}

// --- Helpers ---

function getParisHour(): number {
  const now = new Date();
  const parisTime = new Intl.DateTimeFormat("fr-FR", {
    timeZone: "Europe/Paris",
    hour: "numeric",
    hour12: false,
  }).format(now);
  return parseInt(parisTime, 10);
}

function getParisDate(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Paris",
  }).format(new Date()); // Format YYYY-MM-DD
}

function getParisDay(): number {
  const day = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Paris",
    weekday: "short",
  }).format(new Date());
  return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(day);
}

// --- Route handler ---

export async function GET(request: Request): Promise<Response> {
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const chatId = getChatId();
  const parisHour = getParisHour();
  const parisDate = getParisDate();
  const results: string[] = [];

  try {
    const state = await getCronState();

    // --- 1. Check site down (toutes les 15 min) ---
    try {
      const siteCheck = await checkSiteUp();

      if (!siteCheck.ok) {
        // Éviter le spam : max 1 alerte par heure
        const shouldAlert =
          !state.lastSiteDownAlert ||
          Date.now() - new Date(state.lastSiteDownAlert).getTime() > 60 * 60 * 1000;

        if (shouldAlert) {
          const jadeToken = getBotToken("jade");
          await sendTelegramMessage({
            chatId,
            text: `🚨 <b>Noé, sorell.fr est down !</b>\n\n${siteCheck.detail ?? "Le site ne répond pas."}\n\nJe revérifie dans 15 min, je te tiens au courant.`,
            botToken: jadeToken,
          });

          await supabaseAdmin.from("telegram_messages").insert({
            bot_name: "jade",
            chat_id: chatId,
            role: "assistant",
            content: `ALERTE SITE DOWN — ${siteCheck.detail}`,
            intent: "cron_site_down",
          });

          results.push("site_down_alert_sent");
        } else {
          results.push("site_down_already_alerted");
        }
      } else {
        results.push("site_ok");
      }
    } catch {
      results.push("site_check_error");
    }

    // --- 2. Résumé quotidien (8h heure Paris) ---
    if (parisHour === 8 && state.lastDailySummary !== parisDate) {
      try {
        const summary = await generateDailySummary();
        if (summary) {
          await sendTelegramMessage({ chatId, text: summary });

          await supabaseAdmin.from("telegram_messages").insert({
            bot_name: "eva",
            chat_id: chatId,
            role: "assistant",
            content: summary,
            intent: "cron_daily_summary",
          });

          results.push("daily_summary_sent");
        } else {
          results.push("no_tasks_for_summary");
        }
      } catch {
        results.push("daily_summary_error");
      }
    }

    // --- 3. Rappels deadline (9h heure Paris) ---
    if (parisHour === 9 && state.lastDeadlineAlert !== parisDate) {
      try {
        const alerts = await checkDeadlineAlerts();
        if (alerts) {
          await sendTelegramMessage({ chatId, text: alerts });

          await supabaseAdmin.from("telegram_messages").insert({
            bot_name: "eva",
            chat_id: chatId,
            role: "assistant",
            content: alerts,
            intent: "cron_deadline_alert",
          });

          results.push("deadline_alert_sent");
        } else {
          results.push("no_deadline_alerts");
        }
      } catch {
        results.push("deadline_alert_error");
      }
    }

    // --- 4. Rapport hebdo Jade (dimanche 9h) ---
    const parisDay = getParisDay();
    if (parisDay === 0 && parisHour === 9 && state.lastWeeklyReport !== parisDate) {
      try {
        const jadeToken = getBotToken("jade");
        const report = await runWeeklyReport();

        await sendTelegramMessage({ chatId, text: report, botToken: jadeToken });

        await supabaseAdmin.from("telegram_messages").insert({
          bot_name: "jade",
          chat_id: chatId,
          role: "assistant",
          content: report,
          intent: "cron_weekly_report",
        });

        results.push("weekly_report_sent");
      } catch {
        results.push("weekly_report_error");
      }
    }

    // --- 5. Alertes business (10h heure Paris) ---
    if (parisHour === 10 && state.lastBusinessAlert !== parisDate) {
      try {
        const bizAlerts = await checkBusinessAlerts();
        if (bizAlerts) {
          await sendTelegramMessage({ chatId, text: bizAlerts });

          await supabaseAdmin.from("telegram_messages").insert({
            bot_name: "eva",
            chat_id: chatId,
            role: "assistant",
            content: bizAlerts,
            intent: "cron_business_alert",
          });

          results.push("business_alert_sent");
        } else {
          results.push("no_business_alerts");
        }
      } catch {
        results.push("business_alert_error");
      }
    }

    // --- 6. Sync Notion (11h heure Paris) ---
    if (parisHour === 11 && state.lastNotionSync !== parisDate) {
      try {
        const activitiesSynced = await syncPendingActivities();
        const usersSynced = await syncAllUsersToNotion();

        await supabaseAdmin.from("telegram_messages").insert({
          bot_name: "eva",
          chat_id: chatId,
          role: "assistant",
          content: `Sync Notion : ${usersSynced} utilisateurs, ${activitiesSynced} activités`,
          intent: "cron_notion_sync",
        });

        results.push("notion_sync_done");
      } catch {
        results.push("notion_sync_error");
      }
    }

    // --- 7. Rappels Planning Communication (toutes les 15 min) ---
    const REMINDER_LOOKBACK_MS = 48 * 60 * 60 * 1000; // 48h en millisecondes
    try {
      // Récupérer les rappels déjà envoyés (dernières 48h) pour éviter les doublons
      const { data: recentReminders } = await supabaseAdmin
        .from("telegram_messages")
        .select("content")
        .eq("intent", "cron_planning_reminder")
        .gte("created_at", new Date(Date.now() - REMINDER_LOOKBACK_MS).toISOString())
        .limit(50);

      const alreadySentKeys = new Set<string>();
      if (recentReminders) {
        for (const r of recentReminders) {
          // Extraire les clés des rappels précédents (stockées dans le content)
          const match = r.content?.match(/\[keys:(.*?)\]/);
          if (match) {
            for (const key of match[1].split(",")) {
              alreadySentKeys.add(key);
            }
          }
        }
      }

      // Construire la date Paris actuelle
      const parisNow = new Date(
        new Date().toLocaleString("en-US", { timeZone: "Europe/Paris" })
      );

      const planningAlert = await checkPlanningReminders(parisNow, alreadySentKeys);
      if (planningAlert) {
        await sendTelegramMessage({ chatId, text: planningAlert });

        // Stocker les clés envoyées pour éviter les doublons
        const keysStr = [...alreadySentKeys].join(",");
        await supabaseAdmin.from("telegram_messages").insert({
          bot_name: "eva",
          chat_id: chatId,
          role: "assistant",
          content: `${planningAlert}\n[keys:${keysStr}]`,
          intent: "cron_planning_reminder",
        });

        results.push("planning_reminder_sent");
      } else {
        results.push("no_planning_reminders");
      }
    } catch {
      results.push("planning_reminder_error");
    }

    return NextResponse.json({ ok: true, results, hour: parisHour, date: parisDate });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur inconnue";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
