type BadgeVariant = "default" | "teal" | "blue" | "purple" | "amber" | "green" | "red" | "yellow" | "orange" | "cyan" | "emerald" | "gray";

interface StatusBadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: "sm" | "md";
}

const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-[#2A2D38] text-[#9CA3AF]",
  teal: "bg-teal-500/10 text-teal-400",
  blue: "bg-blue-500/10 text-blue-400",
  purple: "bg-purple-500/10 text-purple-400",
  amber: "bg-amber-500/10 text-amber-400",
  green: "bg-emerald-500/10 text-emerald-400",
  red: "bg-red-500/10 text-red-400",
  yellow: "bg-yellow-500/10 text-yellow-400",
  orange: "bg-orange-500/10 text-orange-400",
  cyan: "bg-cyan-500/10 text-cyan-400",
  emerald: "bg-emerald-500/10 text-emerald-400",
  gray: "bg-[#2A2D38] text-[#6B7280]",
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
