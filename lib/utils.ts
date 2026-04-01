/**
 * Echappe les caracteres HTML dangereux pour prevenir les XSS.
 */
export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Validation basique du format email (RFC 5321 simplifie).
 */
export function isValidEmail(email: string): boolean {
  if (!email || email.length > 320) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Tronque une chaine a la longueur maximale specifiee.
 */
export function truncateInput(str: string, maxLength: number): string {
  if (!str) return "";
  return str.length > maxLength ? str.slice(0, maxLength) : str;
}
