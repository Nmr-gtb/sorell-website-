type BadgeVariant = "default" | "teal" | "blue" | "purple" | "amber" | "green" | "red" | "yellow" | "orange" | "cyan" | "emerald" | "gray";

interface StatusBadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: "sm" | "md";
}

const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-[var(--surface-hover)] text-[var(--text-secondary)]",
  teal: "bg-[var(--accent)]/10 text-[var(--accent)]",
  blue: "bg-blue-50 text-blue-600",
  purple: "bg-purple-50 text-purple-600",
  amber: "bg-amber-50 text-amber-600",
  green: "bg-emerald-50 text-emerald-600",
  red: "bg-red-50 text-red-600",
  yellow: "bg-yellow-50 text-yellow-600",
  orange: "bg-orange-50 text-orange-600",
  cyan: "bg-cyan-50 text-cyan-600",
  emerald: "bg-emerald-50 text-emerald-600",
  gray: "bg-[var(--surface-hover)] text-[var(--text-secondary)]",
};

const sizeStyles = {
  sm: "px-2 py-0.5 text-xs",
  md: "px-2.5 py-1 text-xs",
};

export default function StatusBadge({ label, variant = "default", size = "sm" }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-md font-medium ${variantStyles[variant]} ${sizeStyles[size]}`}
    >
      {label}
    </span>
  );
}

export function getPlanBadgeVariant(plan: string): BadgeVariant {
  const map: Record<string, BadgeVariant> = {
    free: "gray",
    pro: "teal",
    business: "purple",
    enterprise: "amber",
  };
  return map[plan] || "default";
}

export function getStatusBadgeVariant(status: string): BadgeVariant {
  const map: Record<string, BadgeVariant> = {
    sent: "green",
    draft: "yellow",
    open: "green",
    click: "blue",
    bounce: "red",
    complaint: "red",
  };
  return map[status] || "default";
}
