import { supabaseAdmin } from "@/lib/supabase-admin";
import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const userId = user.id;

    // Récupérer toutes les données de l'utilisateur en parallèle
    const [profileRes, configRes, recipientsRes, newslettersRes, lifecycleRes] =
      await Promise.all([
        supabaseAdmin
          .from("profiles")
          .select("id, email, full_name, plan, created_at")
          .eq("id", userId)
          .maybeSingle(),
        supabaseAdmin
          .from("newsletter_config")
          .select("topics, custom_topics, custom_brief, sources, recipients, frequency, send_day, send_hour")
          .eq("user_id", userId)
          .maybeSingle(),
        supabaseAdmin
          .from("recipients")
          .select("email, name, created_at")
          .eq("user_id", userId),
        supabaseAdmin
          .from("newsletters")
          .select("id, subject, content, created_at, sent_at")
          .eq("user_id", userId)
          .order("created_at", { ascending: false }),
        supabaseAdmin
          .from("lifecycle_emails")
          .select("email_type, sent_at")
          .eq("user_id", userId),
      ]);

    const exportData = {
      exported_at: new Date().toISOString(),
      profile: profileRes.data || null,
      newsletter_config: configRes.data || null,
      recipients: recipientsRes.data || [],
      newsletters: newslettersRes.data || [],
      lifecycle_emails: lifecycleRes.data || [],
    };

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="sorell-export-${new Date().toISOString().split("T")[0]}.json"`,
      },
    });
  } catch (err: unknown) {
    return NextResponse.json({ error: "Une erreur est survenue" }, { status: 500 });
  }
}
