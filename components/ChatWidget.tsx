"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useLanguage } from "@/lib/LanguageContext";
import { BRIEF_TEMPLATES } from "@/lib/chat-system-prompt";

type Message = {
  role: "user" | "assistant";
  content: string;
};

type ChatMode = "general" | "brief";

const WELCOME_FR: Record<ChatMode, string> = {
  general: "Salut ! Moi c'est Soly. Une question sur Sorell ?",
  brief: "Salut ! Je vais t'aider a ecrire un bon brief pour ta newsletter.\n\nDans quel secteur tu travailles ?",
};

const WELCOME_EN: Record<ChatMode, string> = {
  general: "Hi! I'm Soly. Got a question about Sorell?",
  brief: "Hi! I'll help you write a great brief for your newsletter.\n\nWhat industry are you in?",
};

const STARTERS_FR = [
  { label: "C'est quoi Sorell ?", message: "C'est quoi Sorell exactement ?" },
  { label: "Gratuit ou payant ?", message: "Est-ce que Sorell est gratuit ?" },
  { label: "Comment ca marche ?", message: "Comment fonctionne Sorell ?" },
];

const STARTERS_EN = [
  { label: "What is Sorell?", message: "What exactly is Sorell?" },
  { label: "Free or paid?", message: "Is Sorell free?" },
  { label: "How does it work?", message: "How does Sorell work?" },
];

const STORAGE_KEY = "soly_chat_history";
const MAX_STORED_CONVERSATIONS = 5;

// Global ref to force open in brief mode from anywhere
let _pendingBriefOpen = false;
let _onBriefReadyCallback: ((brief: string) => void) | null = null;

export function openSolyBrief(onBriefReady: (brief: string) => void) {
  _onBriefReadyCallback = onBriefReady;
  _pendingBriefOpen = true;
  window.dispatchEvent(new CustomEvent("soly:open-brief"));
}

function saveConversation(mode: ChatMode, messages: Message[]) {
  if (messages.length <= 1) return; // Don't save welcome-only
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    const conversation = { mode, messages, timestamp: Date.now() };
    stored.unshift(conversation);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored.slice(0, MAX_STORED_CONVERSATIONS)));
  } catch {
    // localStorage full or unavailable
  }
}

export default function ChatWidget() {
  const { lang, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [hasAutoOpened, setHasAutoOpened] = useState(false);
  const [mode, setMode] = useState<ChatMode>("general");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [briefExtracted, setBriefExtracted] = useState<string | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const modeRef = useRef<ChatMode>("general");

  const starters = lang === "en" ? STARTERS_EN : STARTERS_FR;

  const getWelcome = useCallback((m: ChatMode) => {
    return lang === "en" ? WELCOME_EN[m] : WELCOME_FR[m];
  }, [lang]);

  // Listen for soly:open-brief event
  useEffect(() => {
    const handleOpenBrief = () => {
      modeRef.current = "brief";
      setMode("brief");
      setIsOpen(true);
      setBriefExtracted(null);
      setShowTemplates(false);
      setMessages([{ role: "assistant", content: getWelcome("brief") }]);
    };
    window.addEventListener("soly:open-brief", handleOpenBrief);
    return () => window.removeEventListener("soly:open-brief", handleOpenBrief);
  }, [getWelcome]);

  // Fallback: check pending brief on each render
  useEffect(() => {
    if (_pendingBriefOpen && mode !== "brief") {
      _pendingBriefOpen = false;
      modeRef.current = "brief";
      setMode("brief");
      setIsOpen(true);
      setBriefExtracted(null);
      setShowTemplates(false);
      setMessages([{ role: "assistant", content: getWelcome("brief") }]);
    }
  });

  // Auto-open on first visit (general mode only)
  useEffect(() => {
    const alreadyShown = localStorage.getItem("soly_shown");
    if (!alreadyShown && !hasAutoOpened) {
      const timer = setTimeout(() => {
        if (modeRef.current === "brief") return;
        setIsOpen(true);
        setHasAutoOpened(true);
        localStorage.setItem("soly_shown", "1");
        setMessages([{ role: "assistant", content: getWelcome("general") }]);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [hasAutoOpened, getWelcome]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, streamingText]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleOpen = () => {
    setIsOpen(true);
    if (messages.length === 0) {
      setMessages([{ role: "assistant", content: getWelcome(mode) }]);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    // Save conversation before closing
    if (messages.length > 1) {
      saveConversation(mode, messages);
    }
    if (mode === "brief") {
      modeRef.current = "general";
      setMode("general");
      setMessages([]);
      setBriefExtracted(null);
      setShowTemplates(false);
      _onBriefReadyCallback = null;
      _pendingBriefOpen = false;
    }
  };

  const extractBrief = (text: string): string | null => {
    const match = text.match(/---BRIEF_READY---\n?([\s\S]*?)\n?---END_BRIEF---/);
    return match ? match[1].trim() : null;
  };

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const currentMode = modeRef.current;
    const newMessages: Message[] = [...messages, { role: "user", content: trimmed }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);
    setStreamingText("");

    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };

      try {
        const { supabase } = await import("@/lib/supabase");
        const { data } = await supabase.auth.getSession();
        if (data.session?.access_token) {
          headers["Authorization"] = `Bearer ${data.session.access_token}`;
        }
      } catch {
        // Not authenticated
      }

      const res = await fetch("/api/chat", {
        method: "POST",
        headers,
        body: JSON.stringify({
          messages: newMessages,
          mode: currentMode,
          stream: true,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        const errMsg = errData?.error || (lang === "en" ? "An error occurred." : "Une erreur est survenue.");
        setMessages([...newMessages, { role: "assistant", content: errMsg }]);
        setLoading(false);
        return;
      }

      // Handle streaming response
      const reader = res.body?.getReader();
      if (!reader) {
        setMessages([...newMessages, { role: "assistant", content: lang === "en" ? "An error occurred." : "Une erreur est survenue." }]);
        setLoading(false);
        return;
      }

      const decoder = new TextDecoder();
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") continue;
            try {
              const parsed = JSON.parse(data);
              if (parsed.text) {
                fullText += parsed.text;
                setStreamingText(fullText);
              }
            } catch {
              // Invalid JSON chunk, skip
            }
          }
        }
      }

      // Finalize message
      const brief = extractBrief(fullText);
      if (brief) {
        setBriefExtracted(brief);
      }

      const cleanedMsg = fullText
        .replace(/---BRIEF_READY---\n?/, "")
        .replace(/\n?---END_BRIEF---/, "")
        .trim();

      setMessages([...newMessages, { role: "assistant", content: cleanedMsg }]);
      setStreamingText("");
    } catch {
      setMessages([
        ...newMessages,
        {
          role: "assistant",
          content: lang === "en" ? "Connection error. Try again." : "Erreur de connexion. Reessaie.",
        },
      ]);
    } finally {
      setLoading(false);
      setStreamingText("");
    }
  };

  const handleSend = () => sendMessage(input);

  const handleStarter = (message: string) => {
    sendMessage(message);
  };

  const handleTemplate = (brief: string) => {
    setShowTemplates(false);
    setBriefExtracted(brief);
    const templateMsg = lang === "en"
      ? `Here's a template brief for your sector. You can use it as-is or customize it.\n\nVoici ton brief :\n${brief}`
      : `Voici un brief template pour ton secteur. Tu peux l'utiliser tel quel ou le personnaliser.\n\nVoici ton brief :\n${brief}`;
    setMessages((prev) => [...prev, { role: "assistant", content: templateMsg }]);
  };

  const handleUseBrief = () => {
    if (briefExtracted && _onBriefReadyCallback) {
      _onBriefReadyCallback(briefExtracted);
      setBriefExtracted(null);
      _onBriefReadyCallback = null;
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: lang === "en"
            ? "Done! Brief added to your config."
            : "C'est fait ! Brief ajoute a ta config.",
        },
      ]);
    }
  };

  // Show conversation starters only when general mode + only welcome message
  const showStarters = mode === "general" && messages.length === 1 && !loading;

  // Bubble (closed)
  if (!isOpen) {
    return (
      <button
        onClick={handleOpen}
        aria-label={t("aria.open_soly")}
        style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          width: 56,
          height: 56,
          borderRadius: "50%",
          background: "var(--accent, #005058)",
          border: "none",
          cursor: "pointer",
          boxShadow: "0 4px 20px rgba(0,0,0,0.2)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999,
          transition: "transform 0.2s ease, box-shadow 0.2s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "scale(1.08)";
          e.currentTarget.style.boxShadow = "0 6px 24px rgba(0,0,0,0.25)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "scale(1)";
          e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.2)";
        }}
      >
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </button>
    );
  }

  // Open chat
  return (
    <div
      style={{
        position: "fixed",
        bottom: 24,
        right: 24,
        width: 380,
        maxWidth: "calc(100vw - 32px)",
        height: 520,
        maxHeight: "calc(100vh - 48px)",
        borderRadius: 16,
        background: "var(--surface, #fff)",
        border: "1px solid var(--border, #e5e5e5)",
        boxShadow: "0 8px 40px rgba(0,0,0,0.15)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        zIndex: 9999,
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "14px 16px",
          background: "var(--accent, #005058)",
          color: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14, lineHeight: 1.2 }}>Soly</div>
            <div style={{ fontSize: 11, opacity: 0.8 }}>
              {mode === "brief"
                ? lang === "en" ? "Brief assistant" : "Assistant brief"
                : lang === "en" ? "Sorell assistant" : "Assistant Sorell"}
            </div>
          </div>
        </div>
        <button
          onClick={handleClose}
          aria-label={t("aria.close_chat")}
          style={{
            background: "none",
            border: "none",
            color: "white",
            cursor: "pointer",
            padding: 4,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: 6,
            opacity: 0.8,
            transition: "opacity 0.15s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.8")}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* Messages */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "16px 14px",
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
            }}
          >
            <div
              style={{
                maxWidth: "85%",
                padding: "10px 14px",
                borderRadius: msg.role === "user" ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                background:
                  msg.role === "user"
                    ? "var(--accent, #005058)"
                    : "var(--bg, #f5f5f5)",
                color: msg.role === "user" ? "white" : "var(--text, #1a1a1a)",
                fontSize: 13,
                lineHeight: 1.55,
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              }}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {/* Streaming text */}
        {loading && streamingText && (
          <div style={{ display: "flex", justifyContent: "flex-start" }}>
            <div
              style={{
                maxWidth: "85%",
                padding: "10px 14px",
                borderRadius: "14px 14px 14px 4px",
                background: "var(--bg, #f5f5f5)",
                color: "var(--text, #1a1a1a)",
                fontSize: 13,
                lineHeight: 1.55,
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              }}
            >
              {streamingText
                .replace(/---BRIEF_READY---\n?/, "")
                .replace(/\n?---END_BRIEF---/, "")}
              <span className="soly-cursor" />
            </div>
          </div>
        )}

        {/* Loading dots (only when no streaming text yet) */}
        {loading && !streamingText && (
          <div style={{ display: "flex", justifyContent: "flex-start" }}>
            <div
              style={{
                padding: "10px 14px",
                borderRadius: "14px 14px 14px 4px",
                background: "var(--bg, #f5f5f5)",
                display: "flex",
                gap: 4,
                alignItems: "center",
              }}
            >
              <span className="soly-dot" style={{ animationDelay: "0ms" }} />
              <span className="soly-dot" style={{ animationDelay: "150ms" }} />
              <span className="soly-dot" style={{ animationDelay: "300ms" }} />
            </div>
          </div>
        )}

        {/* Conversation starters */}
        {showStarters && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 4 }}>
            {starters.map((s) => (
              <button
                key={s.label}
                onClick={() => handleStarter(s.message)}
                style={{
                  padding: "7px 14px",
                  borderRadius: 20,
                  border: "1px solid var(--border, #e5e5e5)",
                  background: "var(--surface, #fff)",
                  color: "var(--accent, #005058)",
                  fontSize: 12,
                  fontWeight: 500,
                  cursor: "pointer",
                  transition: "background 0.15s, border-color 0.15s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(0,80,88,0.06)";
                  e.currentTarget.style.borderColor = "var(--accent, #005058)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "var(--surface, #fff)";
                  e.currentTarget.style.borderColor = "var(--border, #e5e5e5)";
                }}
              >
                {s.label}
              </button>
            ))}
          </div>
        )}

        {/* Brief templates button */}
        {mode === "brief" && messages.length === 1 && !loading && (
          <div style={{ marginTop: 4 }}>
            <button
              onClick={() => setShowTemplates(!showTemplates)}
              style={{
                padding: "7px 14px",
                borderRadius: 20,
                border: "1px dashed var(--border, #e5e5e5)",
                background: "transparent",
                color: "var(--text-muted, #888)",
                fontSize: 12,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
              </svg>
              {lang === "en" ? "Or use a template" : "Ou utiliser un template"}
            </button>

            {showTemplates && (
              <div style={{
                display: "flex",
                flexWrap: "wrap",
                gap: 6,
                marginTop: 8,
              }}>
                {BRIEF_TEMPLATES.map((tmpl) => (
                  <button
                    key={tmpl.id}
                    onClick={() => handleTemplate(tmpl.brief)}
                    style={{
                      padding: "6px 12px",
                      borderRadius: 16,
                      border: "1px solid var(--border, #e5e5e5)",
                      background: "var(--surface, #fff)",
                      color: "var(--text, #1a1a1a)",
                      fontSize: 11,
                      cursor: "pointer",
                      transition: "all 0.15s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "rgba(0,80,88,0.06)";
                      e.currentTarget.style.borderColor = "var(--accent, #005058)";
                      e.currentTarget.style.color = "var(--accent, #005058)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "var(--surface, #fff)";
                      e.currentTarget.style.borderColor = "var(--border, #e5e5e5)";
                      e.currentTarget.style.color = "var(--text, #1a1a1a)";
                    }}
                  >
                    {lang === "en" ? tmpl.labelEn : tmpl.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Use brief button */}
        {briefExtracted && _onBriefReadyCallback && (
          <div style={{ display: "flex", justifyContent: "center", padding: "4px 0" }}>
            <button
              onClick={handleUseBrief}
              style={{
                padding: "10px 20px",
                borderRadius: 10,
                border: "none",
                background: "var(--accent, #005058)",
                color: "white",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              {lang === "en" ? "Use this brief" : "Utiliser ce brief"}
            </button>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div
        style={{
          padding: "12px 14px",
          borderTop: "1px solid var(--border, #e5e5e5)",
          display: "flex",
          gap: 8,
          flexShrink: 0,
          background: "var(--surface, #fff)",
        }}
      >
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder={lang === "en" ? "Type your message..." : "Ecris ton message..."}
          disabled={loading}
          aria-label={t("aria.message_soly")}
          style={{
            flex: 1,
            padding: "10px 14px",
            borderRadius: 10,
            border: "1px solid var(--border, #e5e5e5)",
            background: "var(--bg, #f9f9f9)",
            color: "var(--text, #1a1a1a)",
            fontSize: 13,
          }}
        />
        <button
          onClick={handleSend}
          disabled={loading || !input.trim()}
          aria-label={t("aria.send")}
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            border: "none",
            background: loading || !input.trim() ? "var(--text-muted, #ccc)" : "var(--accent, #005058)",
            color: "white",
            cursor: loading || !input.trim() ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </div>

      <style>{`
        @keyframes solyBounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-4px); opacity: 1; }
        }
        .soly-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--text-muted, #999);
          animation: solyBounce 1s infinite;
          display: inline-block;
        }
        @keyframes solyCursorBlink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        .soly-cursor {
          display: inline-block;
          width: 2px;
          height: 14px;
          background: var(--accent, #005058);
          margin-left: 2px;
          vertical-align: text-bottom;
          animation: solyCursorBlink 0.8s infinite;
        }
      `}</style>
    </div>
  );
}
