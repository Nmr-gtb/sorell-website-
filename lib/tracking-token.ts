import { createHmac } from "crypto";

// Signature HMAC des liens de tracking (ouverture + clic).
// But : empêcher qu'un lien /api/track/* soit forgé ou détourné.
//  - clic : la signature couvre (newsletterId, email, url) → pas d'open redirect
//    (impossible de changer l'url sans invalider la signature) ni de faux clic.
//  - ouverture : la signature couvre (newsletterId, email) → pas de fausse ouverture.
// On réutilise le secret des liens de désabonnement (aucune nouvelle variable).

function getSecret(): string {
  const secret = process.env.UNSUBSCRIBE_SECRET || process.env.CRON_SECRET || "";
  if (!secret) {
    throw new Error("UNSUBSCRIBE_SECRET ou CRON_SECRET doit être défini");
  }
  return secret;
}

function sign(payload: string): string {
  return createHmac("sha256", getSecret()).update(payload).digest("hex").substring(0, 16);
}

/** Comparaison à temps constant de deux tokens de même longueur attendue. */
function tokenMatches(expected: string, provided: string): boolean {
  if (expected.length !== provided.length) return false;
  let result = 0;
  for (let i = 0; i < expected.length; i++) {
    result |= expected.charCodeAt(i) ^ provided.charCodeAt(i);
  }
  return result === 0;
}

const openPayload = (nid: string, email: string) => `open:${nid}:${email.toLowerCase().trim()}`;
const clickPayload = (nid: string, email: string, url: string) =>
  `click:${nid}:${email.toLowerCase().trim()}:${url}`;

export function generateOpenToken(nid: string, email: string): string {
  return sign(openPayload(nid, email));
}

export function verifyOpenToken(nid: string, email: string, token: string | null): boolean {
  if (!token) return false;
  return tokenMatches(generateOpenToken(nid, email), token);
}

export function generateClickToken(nid: string, email: string, url: string): string {
  return sign(clickPayload(nid, email, url));
}

export function verifyClickToken(nid: string, email: string, url: string, token: string | null): boolean {
  if (!token) return false;
  return tokenMatches(generateClickToken(nid, email, url), token);
}
