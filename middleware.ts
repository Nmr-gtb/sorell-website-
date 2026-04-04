import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only protect /admin routes (except /admin-login itself)
  if (pathname.startsWith("/admin") && pathname !== "/admin-login") {
    const token = request.cookies.get("admin_token")?.value;

    if (!token) {
      return NextResponse.redirect(new URL("/admin-login", request.url));
    }

    // Basic JWT structure validation (full verification happens in API routes)
    const parts = token.split(".");
    if (parts.length !== 3) {
      const response = NextResponse.redirect(new URL("/admin-login", request.url));
      response.cookies.set("admin_token", "", { maxAge: 0, path: "/" });
      return response;
    }
  }

  // Protect /api/admin routes (except /api/admin/login)
  if (pathname.startsWith("/api/admin") && !pathname.startsWith("/api/admin/login")) {
    const cookieHeader = request.headers.get("cookie") || "";
    const tokenMatch = cookieHeader.match(/admin_token=([^;]+)/);

    if (!tokenMatch) {
      return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/admin-login", "/api/admin/:path*"],
};
