import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH;

/** Max JWT token lifetime: 24 hours (reduced from 7 days for security) */
const TOKEN_EXPIRY = "24h";
const TOKEN_EXPIRY_MS = 24 * 60 * 60 * 1000;

export { TOKEN_EXPIRY_MS };

export interface AdminPayload {
  email: string;
  role: "admin";
  iat: number;
  exp: number;
}

/** UUID v4 format validator */
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isValidUUID(value: string): boolean {
  return UUID_REGEX.test(value);
}

function getJwtSecret(): string {
  if (!ADMIN_JWT_SECRET || ADMIN_JWT_SECRET.length < 32) {
    throw new Error("ADMIN_JWT_SECRET is missing or too short (min 32 chars)");
  }
  return ADMIN_JWT_SECRET;
}

export async function verifyAdminCredentials(email: string, password: string): Promise<boolean> {
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD_HASH) return false;
  if (email !== ADMIN_EMAIL) return false;
  return bcrypt.compare(password, ADMIN_PASSWORD_HASH);
}

export function generateAdminToken(email: string): string {
  return jwt.sign(
    { email, role: "admin" as const },
    getJwtSecret(),
    { expiresIn: TOKEN_EXPIRY, algorithm: "HS256" }
  );
}

export function verifyAdminToken(token: string): AdminPayload | null {
  try {
    const payload = jwt.verify(token, getJwtSecret(), {
      algorithms: ["HS256"],
    }) as AdminPayload;
    if (payload.role !== "admin") return null;
    return payload;
  } catch {
    return null;
  }
}

export function getAdminTokenFromRequest(request: Request): string | null {
  const cookieHeader = request.headers.get("cookie");
  if (!cookieHeader) return null;

  const match = cookieHeader.match(/admin_token=([^;]+)/);
  return match ? match[1] : null;
}

export function getAuthenticatedAdmin(request: Request): AdminPayload | null {
  const token = getAdminTokenFromRequest(request);
  if (!token) return null;
  return verifyAdminToken(token);
}
