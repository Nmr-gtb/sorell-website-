interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

export default function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 12,
        padding: "24px",
        boxShadow: "var(--shadow-sm)",
        transition: "box-shadow 0.2s ease, border-color 0.2s ease",
        cursor: "default",
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.boxShadow = "var(--shadow-md)";
        el.style.borderColor = "var(--accent-border)";
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.boxShadow = "var(--shadow-sm)";
        el.style.borderColor = "var(--border)";
      }}
    >
      {/* Icon container */}
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 16,
          background: "var(--accent-subtle)",
          border: "1px solid var(--accent-border)",
          flexShrink: 0,
          color: "var(--accent)",
        }}
      >
        {icon}
      </div>

      <h3
        style={{
          fontFamily: "var(--font-body, 'DM Sans', sans-serif)",
          fontSize: "0.9375rem",
          fontWeight: 600,
          color: "var(--text)",
          marginBottom: 8,
          lineHeight: 1.3,
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
