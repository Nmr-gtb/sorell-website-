import { NextResponse } from "next/server";
import { getSolySystemPrompt } from "@/lib/chat-system-prompt";
import {
  chatHourlyLimit,
  chatDailyLimit,
  chatAnonHourlyLimit,
  chatAnonDailyLimit,
} from "@/lib/ratelimit";
import { getAuthenticatedUser } from "@/lib/auth";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export async function POST(request: Request) {
  try {
    // Auth optionnelle : les visiteurs non connectes peuvent aussi utiliser Soly
    const authUser = await getAuthenticatedUser(request).catch(() => null);

    // Rate limiting double couche (horaire + quotidien) — anti-abus
    const isAuthenticated = !!authUser?.id;

    // Cle de rate limit : user ID si auth, sinon IP reelle (Vercel fournit x-real-ip)
    // x-real-ip est defini par Vercel/reverse proxy (non forgeable contrairement a x-forwarded-for)
    // Fallback sur x-forwarded-for (premier element = IP client), puis hash de requete
    let rateLimitKey: string;
    if (isAuthenticated) {
      rateLimitKey = authUser.id;
    } else {
      const realIp = request.headers.get("x-real-ip");
      const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
      rateLimitKey = realIp || forwardedFor || `anon_${Date.now()}`;
    }

    try {
      const hourlyLimiter = isAuthenticated ? chatHourlyLimit : chatAnonHourlyLimit;
      const dailyLimiter = isAuthenticated ? chatDailyLimit : chatAnonDailyLimit;

      const [hourly, daily] = await Promise.all([
        hourlyLimiter.limit(rateLimitKey),
        dailyLimiter.limit(rateLimitKey),
      ]);

      if (!hourly.success) {
        return NextResponse.json(
          { error: "Trop de messages. Reessaie dans quelques minutes." },
          { status: 429 }
        );
      }
      if (!daily.success) {
        return NextResponse.json(
          { error: "Tu as atteint la limite quotidienne. Reviens demain !" },
          { status: 429 }
        );
      }
    } catch {
      // Rate limiter indisponible — fail-close pour securite
      return NextResponse.json(
        { error: "Service temporairement indisponible. Reessaie dans un instant." },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { messages, mode } = body as {
      messages: ChatMessage[];
      mode: "general" | "brief";
    };

    // Validation
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "Messages requis" }, { status: 400 });
    }

    if (mode !== "general" && mode !== "brief") {
      return NextResponse.json({ error: "Mode invalide" }, { status: 400 });
    }

    // Limiter l'historique a 20 messages pour controler les couts
    const trimmedMessages = messages.slice(-20);

    // Validation de chaque message
    for (const msg of trimmedMessages) {
      if (!msg.role || !msg.content) {
        return NextResponse.json({ error: "Format de message invalide" }, { status: 400 });
      }
      if (msg.role !== "user" && msg.role !== "assistant") {
        return NextResponse.json({ error: "Role invalide" }, { status: 400 });
      }
      if (typeof msg.content !== "string" || msg.content.length > 2000) {
        return NextResponse.json({ error: "Message trop long (max 2000 caracteres)" }, { status: 400 });
      }
    }

    const systemPrompt = getSolySystemPrompt(mode);

    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 500,
      system: systemPrompt,
      messages: trimmedMessages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    });

    const assistantMessage =
      response.content[0]?.type === "text" ? response.content[0].text : "";

    return NextResponse.json({ message: assistantMessage });
  } catch {
    return NextResponse.json(
      { error: "Une erreur est survenue" },
      { status: 500 }
    );
  }
}
