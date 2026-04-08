/**
 * Telegram Bot API helpers
 * Utilise fetch natif pour communiquer avec l'API Telegram.
 */

const TELEGRAM_API_BASE = "https://api.telegram.org/bot";

// --- Bot registry ---

export type BotName = "eva" | "jade";

interface BotConfig {
  tokenEnv: string;
  secretEnv: string;
  webhookPath: string;
}

const BOT_REGISTRY: Record<BotName, BotConfig> = {
  eva: {
    tokenEnv: "TELEGRAM_BOT_TOKEN",
    secretEnv: "TELEGRAM_WEBHOOK_SECRET",
    webhookPath: "/api/telegram/webhook",
  },
  jade: {
    tokenEnv: "TELEGRAM_JADE_BOT_TOKEN",
    secretEnv: "TELEGRAM_JADE_WEBHOOK_SECRET",
    webhookPath: "/api/telegram/jade/webhook",
  },
};

export function getBotToken(bot: BotName = "eva"): string {
  const config = BOT_REGISTRY[bot];
  const token = process.env[config.tokenEnv];
  if (!token) throw new Error(`${config.tokenEnv} manquant`);
  return token;
}

export function getBotSecret(bot: BotName): string {
  const config = BOT_REGISTRY[bot];
  const secret = process.env[config.secretEnv];
  if (!secret) throw new Error(`${config.secretEnv} manquant`);
  return secret;
}

export function getBotWebhookPath(bot: BotName): string {
  return BOT_REGISTRY[bot].webhookPath;
}

interface TelegramSendMessageParams {
  chatId: number | string;
  text: string;
  parseMode?: "HTML" | "Markdown" | "MarkdownV2";
  botToken?: string;
}

interface TelegramApiResponse {
  ok: boolean;
  description?: string;
  result?: unknown;
}

/**
 * Envoie un message texte via l'API Telegram.
 * Si botToken n'est pas fourni, utilise le token d'Eva par défaut.
 */
export async function sendTelegramMessage({
  chatId,
  text,
  parseMode = "HTML",
  botToken,
}: TelegramSendMessageParams): Promise<TelegramApiResponse> {
  const token = botToken ?? getBotToken("eva");
  const url = `${TELEGRAM_API_BASE}${token}/sendMessage`;

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
 * Enregistre le webhook Telegram pour un bot spécifique.
 */
export async function setTelegramWebhook(
  webhookUrl: string,
  botToken?: string
): Promise<TelegramApiResponse> {
  const token = botToken ?? getBotToken("eva");
  const url = `${TELEGRAM_API_BASE}${token}/setWebhook`;

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
