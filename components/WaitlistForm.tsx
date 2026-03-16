"use client";

import { useState } from "react";

interface WaitlistFormProps {
  size?: "default" | "large";
  placeholder?: string;
  buttonText?: string;
}

export default function WaitlistForm({
  size = "default",
  placeholder = "votre@email.com",
  buttonText = "Rejoindre la waitlist",
}: WaitlistFormProps) {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@")) return;
    setLoading(true);
    await new Promise((r) => setTimeout(r, 700));
    console.log("[Waitlist] Email enregistré:", email);
    setSubmitted(true);
    setLoading(false);
  };

  if (submitted) {
    return (
      <div
        className="flex items-center gap-3 px-5 py-3.5 rounded-xl border"
        style={{
          background: "rgba(16, 185, 129, 0.08)",
          borderColor: "rgba(16, 185, 129, 0.25)",
        }}
      >
        <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 20 20" fill="none">
          <circle cx="10" cy="10" r="9" stroke="#10b981" strokeWidth="1.5" />
          <path d="M6.5 10l2.5 2.5 4-4" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <p className="text-sm font-medium" style={{ color: "#10b981" }}>
          Parfait ! Vous recevrez un échantillon sous peu.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 w-full max-w-md">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder={placeholder}
        required
        className={`input-field flex-1 ${size === "large" ? "px-5 py-4 text-base" : "px-4 py-3 text-sm"}`}
      />
      <button
        type="submit"
        disabled={loading}
        className={`btn-accent whitespace-nowrap flex-shrink-0 ${size === "large" ? "px-6 py-4 text-base" : "px-5 py-3 text-sm"}`}
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" opacity="0.25" />
              <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            Envoi...
          </span>
        ) : (
          buttonText
        )}
      </button>
    </form>
  );
}
