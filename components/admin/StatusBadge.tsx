type BadgeVariant = "default" | "teal" | "blue" | "purple" | "amber" | "green" | "red" | "yellow" | "orange" | "cyan" | "emerald" | "gray";

interface StatusBadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: "sm" | "md";
}

const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-[var(--surface-hover)] text-[var(--text-secondary)]",
  teal: "bg-teal-50 text-teal-700 dark:bg-teal-950/30 dark:text-teal-400",
  blue: "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400",
  purple: "bg-purple-50 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400",
  amber: "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400",
  green: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400",
  red: "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400",
  yellow: "bg-yellow-50 text-yellow-700 dark:bg-yellow-950/30 dark:text-yellow-400",
  orange: "bg-orange-50 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400",
  cyan: "bg-cyan-50 text-cyan-700 dark:bg-cyan-950/30 dark:text-cyan-400",
  emerald: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400",
  gray: "bg-[var(--surface-hover)] text-[var(--text-secondary)]",
};

const sizeStyles = {
  sm: "px-2.5 py-0.5 text-[11px]",
  md: "px-3 py-1 text-xs",
};

export default function StatusBadge({ label, variant = "default", size = "sm" }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full font-semibold tracking-wide ${variantStyles[variant]} ${sizeStyles[size]}`}
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
