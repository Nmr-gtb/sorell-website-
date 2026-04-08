/**
 * Telegram Bot API helpers
 * Utilise fetch natif pour communiquer avec l'API Telegram.
 */

const TELEGRAM_API_BASE = "https://api.telegram.org/bot";

function getBotToken(): string {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN manquant");
  return token;
}

interface TelegramSendMessageParams {
  chatId: number | string;
  text: string;
  parseMode?: "HTML" | "Markdown" | "MarkdownV2";
}

interface TelegramApiResponse {
  ok: boolean;
  description?: string;
  result?: unknown;
}

/**
 * Envoie un message texte via l'API Telegram.
 */
export async function sendTelegramMessage({
  chatId,
  text,
  parseMode = "HTML",
}: TelegramSendMessageParams): Promise<TelegramApiResponse> {
  const url = `${TELEGRAM_API_BASE}${getBotToken()}/sendMessage`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: parseMode,
      }),
    });

    const data = (await response.json()) as TelegramApiResponse;

    if (!data.ok) {
      throw new Error(`Telegram API error: ${data.description ?? "Erreur inconnue"}`);
    }

    return data;
  } catch (error) {
    throw new Error(
      `Erreur envoi Telegram: ${error instanceof Error ? error.message : "Erreur inconnue"}`
    );
  }
}

/**
 * Enregistre le webhook Telegram.
 */
export async function setTelegramWebhook(webhookUrl: string): Promise<TelegramApiResponse> {
  const url = `${TELEGRAM_API_BASE}${getBotToken()}/setWebhook`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: webhookUrl,
        allowed_updates: ["message"],
      }),
    });

    const data = (await response.json()) as TelegramApiResponse;

    if (!data.ok) {
      throw new Error(`Telegram setWebhook error: ${data.description ?? "Erreur inconnue"}`);
    }

    return data;
  } catch (error) {
    throw new Error(
      `Erreur configuration webhook: ${error instanceof Error ? error.message : "Erreur inconnue"}`
    );
  }
}

/**
 * Types pour les messages Telegram entrants (webhook update).
 */
export interface TelegramUser {
  id: number;
  is_bot: boolean;
  first_name: string;
  last_name?: string;
  username?: string;
}

export interface TelegramMessage {
  message_id: number;
  from?: TelegramUser;
  chat: {
    id: number;
    type: string;
  };
  date: number;
  text?: string;
}

export interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
}
