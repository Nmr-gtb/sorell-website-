/**
 * Eva Notifications — Messages proactifs d'Eva sur Telegram.
 * Notifications lors d'événements importants (inscription, paiement, etc.)
 */

import { sendTelegramMessage } from "@/lib/telegram-bot";

function getChatId(): number {
  const id = process.env.TELEGRAM_USER_ID;
  if (!id) throw new Error("TELEGRAM_USER_ID manquant");
  return parseInt(id, 10);
}

/**
 * Notifie Noé qu'un nouvel utilisateur s'est inscrit.
 */
export async function notifyNewSignup(name: string, email: string): Promise<void> {
  try {
    const chatId = getChatId();
    const displayName = name || "quelqu'un";
    const text = `Salut Noé ! Une nouvelle inscription sur Sorell : <b>${displayName}</b> (${email}).`;
    await sendTelegramMessage({ chatId, text });
  } catch {
    // Ne pas faire échouer le flow principal
  }
}

/**
 * Notifie Noé qu'un utilisateur a pris un plan payant.
 */
export async function notifyNewSubscription(
  name: string,
  email: string,
  plan: string
): Promise<void> {
  try {
    const chatId = getChatId();
    const displayName = name || email;
    const planLabel = plan.charAt(0).toUpperCase() + plan.slice(1);
    const text = `Noé, <b>${displayName}</b> vient de passer au plan <b>${planLabel}</b> ! 🎉`;
    await sendTelegramMessage({ chatId, text });
  } catch {
    // Ne pas faire échouer le flow principal
  }
}
