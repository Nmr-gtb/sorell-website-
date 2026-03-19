import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email");
  const userId = searchParams.get("uid");

  if (!email) {
    return NextResponse.redirect(new URL("/desabonnement?status=error", request.url));
  }

  try {
    if (userId) {
      await supabase.from("recipients").delete().eq("email", email).eq("user_id", userId);
    } else {
      await supabase.from("recipients").delete().eq("email", email);
    }

    return NextResponse.redirect(
      new URL("/desabonnement?status=success&email=" + encodeURIComponent(email), request.url)
    );
  } catch {
    return NextResponse.redirect(new URL("/desabonnement?status=error", request.url));
  }
}
