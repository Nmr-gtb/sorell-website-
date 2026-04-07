import { getSolySystemPrompt } from "@/lib/chat-system-prompt";
import type { UserContext } from "@/lib/chat-system-prompt";
import {
  chatHourlyLimit,
  chatDailyLimit,
  chatAnonHourlyLimit,
  chatAnonDailyLimit,
} from "@/lib/ratelimit";
import { getAuthenticatedUser } from "@/lib/auth";
import Anthropic from "@anthropic-ai/sdk";
import { supabaseAdmin } from "@/lib/supabase-admin";

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
        return new Response(
          JSON.stringify({ error: "Trop de messages. Reessaie dans quelques minutes." }),
          { status: 429, headers: { "Content-Type": "application/json" } }
        );
      }
      if (!daily.success) {
        return new Response(
          JSON.stringify({ error: "Tu as atteint la limite quotidienne. Reviens demain !" }),
          { status: 429, headers: { "Content-Type": "application/json" } }
        );
      }
    } catch {
      return new Response(
        JSON.stringify({ error: "Service temporairement indisponible. Reessaie dans un instant." }),
        { status: 503, headers: { "Content-Type": "application/json" } }
      );
    }

    const body = await request.json();
    const { messages, mode, stream, userContext: clientContext } = body as {
      messages: ChatMessage[];
      mode: "general" | "brief";
      stream?: boolean;
      userContext?: UserContext;
    };

    // Validation
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "Messages requis" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (mode !== "general" && mode !== "brief") {
      return new Response(JSON.stringify({ error: "Mode invalide" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Limiter l'historique a 20 messages pour controler les couts
    const trimmedMessages = messages.slice(-20);

    // Validation de chaque message
    for (const msg of trimmedMessages) {
      if (!msg.role || !msg.content) {
        return new Response(JSON.stringify({ error: "Format de message invalide" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
      if (msg.role !== "user" && msg.role !== "assistant") {
        return new Response(JSON.stringify({ error: "Role invalide" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
      if (typeof msg.content !== "string" || msg.content.length > 2000) {
        return new Response(JSON.stringify({ error: "Message trop long (max 2000 caracteres)" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    // Build user context from auth + client hints
    let userContext: UserContext | undefined;
    if (isAuthenticated) {
      try {
        const [profileRes, configRes] = await Promise.all([
          supabaseAdmin.from("profiles").select("plan").eq("id", authUser.id).single(),
          supabaseAdmin.from("newsletter_config").select("topics, custom_brief, sources").eq("user_id", authUser.id).single(),
        ]);
        const plan = profileRes.data?.plan || "free";
        const config = configRes.data;
        const enabledTopics = config?.topics?.filter((t: { enabled: boolean; label: string }) => t.enabled)?.map((t: { label: string }) => t.label) || [];

        userContext = {
          plan,
          topics: enabledTopics.length > 0 ? enabledTopics : undefined,
          existingBrief: config?.custom_brief || undefined,
        };
      } catch {
        // Silently continue without context
      }
    }
    // Merge client-provided context (sector only, for safety)
    if (clientContext?.sector && !userContext?.sector) {
      userContext = { ...userContext, sector: clientContext.sector };
    }

    const systemPrompt = getSolySystemPrompt(mode, userContext);

    // Streaming mode
    if (stream) {
      const streamResponse = await anthropic.messages.stream({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 500,
        system: systemPrompt,
        messages: trimmedMessages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
      });

      const encoder = new TextEncoder();
      const readableStream = new ReadableStream({
        async start(controller) {
          try {
            for await (const event of streamResponse) {
              if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`));
              }
            }
            controller.enqueue(encoder.encode("data: [DONE]\n\n"));
            controller.close();
          } catch {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: "Erreur de generation" })}\n\n`));
            controller.close();
          }
        },
      });

      return new Response(readableStream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    }

    // Non-streaming mode (backward compatible)
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

    return new Response(JSON.stringify({ message: assistantMessage }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return new Response(JSON.stringify({ error: "Une erreur est survenue" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
