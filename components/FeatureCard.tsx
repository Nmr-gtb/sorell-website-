interface FeatureCardProps {
  icon: string;
  title: string;
  description: string;
}

export default function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div
      className="card p-6 group cursor-default"
      style={{ transition: "all 0.25s ease" }}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center text-xl mb-4 transition-all duration-200 group-hover:scale-110"
        style={{
          background: "rgba(124, 58, 237, 0.1)",
          border: "1px solid rgba(124, 58, 237, 0.2)",
        }}
      >
        {icon}
      </div>
      <h3
        className="text-base font-semibold mb-2"
        style={{ color: "#f0f0f5" }}
      >
        {title}
      </h3>
      <p className="text-sm leading-relaxed" style={{ color: "#9090aa" }}>
        {description}
      </p>
    </div>
  );
}
