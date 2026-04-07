import { createHmac } from "crypto";

function getSecret(): string {
  const secret = process.env.UNSUBSCRIBE_SECRET || process.env.CRON_SECRET || "";
  if (!secret) {
    throw new Error("UNSUBSCRIBE_SECRET ou CRON_SECRET doit etre defini dans les variables d'environnement");
  }
  return secret;
}

/**
 * Genere un token HMAC pour verifier l'adresse email d'un utilisateur.
 * Utilise un prefixe different de l'unsubscribe pour eviter la reutilisation de tokens.
 */
export function generateEmailVerifyToken(email: string): string {
  return createHmac("sha256", getSecret())
    .update(`verify:${email.toLowerCase().trim()}`)
    .digest("hex")
    .substring(0, 16);
}

/**
 * Verifie qu'un token de verification email est valide.
 */
export function verifyEmailToken(email: string, token: string): boolean {
  const expected = generateEmailVerifyToken(email);
  if (expected.length !== token.length) return false;
  let result = 0;
  for (let i = 0; i < expected.length; i++) {
    result |= expected.charCodeAt(i) ^ token.charCodeAt(i);
  }
  return result === 0;
}

/**
 * Genere l'URL complete de verification email.
 */
export function buildVerifyEmailUrl(email: string): string {
  const token = generateEmailVerifyToken(email);
  const params = new URLSearchParams({ email, token });
  return `https://www.sorell.fr/api/verify-email?${params.toString()}`;
}
