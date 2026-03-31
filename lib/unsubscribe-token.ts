import { createHmac } from "crypto";

const SECRET = process.env.CRON_SECRET || "fallback-secret";

/**
 * Génère un token HMAC pour sécuriser les liens de désabonnement.
 * Le token est basé sur l'email du destinataire, empêchant
 * un attaquant de désabonner un email sans connaître le token.
 */
export function generateUnsubscribeToken(email: string): string {
  return createHmac("sha256", SECRET)
    .update(email.toLowerCase().trim())
    .digest("hex")
    .substring(0, 16); // 16 chars suffisent pour la sécurité
}

/**
 * Vérifie qu'un token de désabonnement est valide pour l'email donné.
 */
export function verifyUnsubscribeToken(email: string, token: string): boolean {
  const expected = generateUnsubscribeToken(email);
  // Comparaison constante pour éviter les timing attacks
  if (expected.length !== token.length) return false;
  let result = 0;
  for (let i = 0; i < expected.length; i++) {
    result |= expected.charCodeAt(i) ^ token.charCodeAt(i);
  }
  return result === 0;
}

/**
 * Génère l'URL complète de désabonnement avec token.
 */
export function buildUnsubscribeUrl(email: string, uid?: string): string {
  const token = generateUnsubscribeToken(email);
  const params = new URLSearchParams({
    email,
    token,
  });
  if (uid) params.set("uid", uid);
  return `https://www.sorell.fr/api/unsubscribe?${params.toString()}`;
}
