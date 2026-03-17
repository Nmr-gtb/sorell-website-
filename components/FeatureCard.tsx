interface FeatureCardProps {
  icon: string;
  title: string;
  description: string;
}

export default function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div
      className="card"
      style={{ padding: "24px", cursor: "default" }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "1.125rem",
          marginBottom: 14,
          background: "var(--surface-alt)",
          border: "1px solid var(--border)",
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <h3
        style={{
          fontSize: "0.9375rem",
          fontWeight: 600,
          color: "var(--text)",
          marginBottom: 6,
          lineHeight: 1.3,
        }}
      >
        {title}
      </h3>
      <p
        style={{
          fontSize: "0.875rem",
          color: "var(--text-secondary)",
          lineHeight: 1.6,
        }}
      >
        {description}
      </p>
    </div>
  );
}
