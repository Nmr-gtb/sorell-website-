/**
 * Historique des conversations Telegram.
 * Stocke et charge les messages pour le multi-turn.
 */

import { supabaseAdmin } from "@/lib/supabase-admin";
import type { BotName } from "@/lib/telegram-bot";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const MAX_HISTORY = 10; // Nombre de messages chargés pour le contexte

/**
 * Sauvegarde un message dans l'historique.
 */
export async function saveMessage(params: {
  botName: BotName;
  chatId: number;
  role: "user" | "assistant";
  content: string;
  intent?: string;
}): Promise<void> {
  await supabaseAdmin.from("telegram_messages").insert({
    bot_name: params.botName,
    chat_id: params.chatId,
    role: params.role,
    content: params.content,
    intent: params.intent ?? null,
  });
}

/**
 * Charge les derniers messages d'une conversation pour le contexte Claude.
 */
export async function loadHistory(
  botName: BotName,
  chatId: number
): Promise<ChatMessage[]> {
  const { data } = await supabaseAdmin
    .from("telegram_messages")
    .select("role, content")
    .eq("bot_name", botName)
    .eq("chat_id", chatId)
    .order("created_at", { ascending: false })
    .limit(MAX_HISTORY);

  if (!data || data.length === 0) return [];

  // Inverser pour avoir l'ordre chronologique
  return data.reverse().map((msg) => ({
    role: msg.role as "user" | "assistant",
    content: msg.content,
  }));
}
