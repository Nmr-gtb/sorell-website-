import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET || "";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "";
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH || "";

export interface AdminPayload {
  email: string;
  role: "admin";
  iat: number;
  exp: number;
}

export function verifyAdminCredentials(email: string, password: string): boolean {
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD_HASH) return false;
  if (email !== ADMIN_EMAIL) return false;
  return bcrypt.compareSync(password, ADMIN_PASSWORD_HASH);
}

export function generateAdminToken(email: string): string {
  return jwt.sign(
    { email, role: "admin" as const },
    ADMIN_JWT_SECRET,
    { expiresIn: "7d" }
  );
}

export function verifyAdminToken(token: string): AdminPayload | null {
  try {
    const payload = jwt.verify(token, ADMIN_JWT_SECRET) as AdminPayload;
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
