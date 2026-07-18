type BadgeVariant = "default" | "teal" | "blue" | "purple" | "amber" | "green" | "red" | "yellow" | "orange" | "cyan" | "emerald" | "gray";

interface StatusBadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: "sm" | "md";
}

// DA Sorell : un seul accent (teal), statuts sémantiques via les tokens du
// thème (suivent le toggle dark), tout le décoratif en neutre. Les anciennes
// teintes Tailwind multi-couleurs (blue/purple/amber/cyan...) violaient la
// règle "max 1 couleur d'accent" et ne suivaient pas le toggle du site.
const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-[var(--surface-hover)] text-[var(--text-secondary)]",
  teal: "bg-[var(--accent-subtle)] text-[var(--accent)]",
  blue: "bg-[var(--accent-subtle)] text-[var(--accent)]",
  purple: "bg-[var(--surface-hover)] text-[var(--text-secondary)]",
  amber: "bg-[var(--surface-hover)] text-[var(--text-secondary)]",
  green: "bg-[var(--success-bg)] text-[var(--success)]",
  red: "bg-[var(--error-bg)] text-[var(--error)]",
  yellow: "bg-[var(--surface-hover)] text-[var(--text-secondary)]",
  orange: "bg-[var(--error-bg)] text-[var(--error)]",
  cyan: "bg-[var(--accent-subtle)] text-[var(--accent)]",
  emerald: "bg-[var(--success-bg)] text-[var(--success)]",
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
