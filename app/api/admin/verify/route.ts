import { NextResponse } from "next/server";
import { getAuthenticatedAdmin } from "@/lib/admin/auth";

export async function GET(request: Request) {
  const admin = getAuthenticatedAdmin(request);

  if (!admin) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }

  return NextResponse.json({ email: admin.email });
}
