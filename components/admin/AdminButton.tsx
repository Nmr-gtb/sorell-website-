import { type ButtonHTMLAttributes, type ReactNode } from "react";

interface AdminButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  children: ReactNode;
  loading?: boolean;
  icon?: ReactNode;
}

const variantStyles = {
  primary:
    "bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] focus-visible:ring-[var(--accent)] shadow-[0_1px_3px_rgba(0,0,0,0.12)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.15)] disabled:opacity-50 disabled:text-white/70",
  secondary:
    "bg-[var(--surface)] text-[var(--text)] hover:bg-[var(--surface-alt)] focus-visible:ring-[var(--border)] border border-[var(--border)] hover:border-[var(--border-hover)] disabled:opacity-50",
  danger:
    "bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500/50 shadow-[0_1px_3px_rgba(220,38,38,0.3)] disabled:bg-red-300 disabled:text-white/70",
  ghost:
    "bg-transparent text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--surface-hover)] focus-visible:ring-[var(--border)] disabled:opacity-50",
};

const sizeStyles = {
  sm: "px-3 py-1.5 text-xs gap-1.5 rounded-lg",
  md: "px-4 py-2.5 text-sm gap-2 rounded-xl",
  lg: "px-6 py-3 text-sm gap-2 rounded-xl",
};

export default function AdminButton({
  variant = "primary",
  size = "md",
  children,
  loading = false,
  icon,
  disabled,
  className = "",
  ...props
}: AdminButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)] disabled:cursor-not-allowed active:scale-[0.98] ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {loading ? (
        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
          />
        </svg>
      ) : icon ? (
        <span className="flex-shrink-0">{icon}</span>
      ) : null}
      {children}
    </button>
  );
}
