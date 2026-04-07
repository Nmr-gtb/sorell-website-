import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { getAuthenticatedUser } from "@/lib/auth";
import { isValidEmail, truncateInput } from "@/lib/utils";

export async function POST(request: Request) {
  try {
    const authUser = await getAuthenticatedUser(request);
    if (!authUser) {
      return NextResponse.json({ error: "Non autorise" }, { status: 401 });
    }

    const { email, name } = await request.json();

    const cleanEmail = truncateInput(String(email || ""), 320).toLowerCase().trim();
    const cleanName = truncateInput(String(name || ""), 200);

    if (!cleanEmail || !isValidEmail(cleanEmail)) {
      return NextResponse.json({ error: "Email invalide" }, { status: 400 });
    }

    const { error } = await supabaseAdmin.from("recipients").upsert(
      { user_id: authUser.id, email: cleanEmail, name: cleanName },
      { onConflict: "user_id,email" }
    );

    if (error) {
      return NextResponse.json({ error: "Erreur lors de l'ajout" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Une erreur est survenue" }, { status: 500 });
  }
}
