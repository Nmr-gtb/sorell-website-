"use client";

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

export default function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div
      className="feature-card"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 12,
        padding: "28px",
        transition: "border-color 0.2s ease",
        cursor: "default",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = "var(--border-hover)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = "var(--border)";
      }}
    >
      <div
        aria-hidden="true"
        style={{
          color: "var(--text)",
          marginBottom: 16,
          opacity: 0.7,
        }}
      >
        {icon}
      </div>
      <h3
        style={{
          fontFamily: "var(--font-inter, 'Inter', sans-serif)",
          fontSize: "0.9375rem",
          fontWeight: 600,
          color: "var(--text)",
          marginBottom: 8,
          letterSpacing: "-0.01em",
        }}
      >
        {title}
      </h3>
      <p
        style={{
          fontSize: "0.875rem",
          color: "var(--text-secondary)",
          lineHeight: 1.65,
        }}
      >
        {description}
      </p>
    </div>
  );
}
