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
    "bg-teal-600 text-white hover:bg-teal-500 focus-visible:ring-teal-500/50 disabled:bg-teal-800 disabled:text-teal-300",
  secondary:
    "bg-[#2A2D38] text-[#F3F4F6] hover:bg-[#3A3D4A] focus-visible:ring-[#3A3D4A] border border-[#3A3D4A] disabled:opacity-50",
  danger:
    "bg-red-600 text-white hover:bg-red-500 focus-visible:ring-red-500/50 disabled:bg-red-800 disabled:text-red-300",
  ghost:
    "bg-transparent text-[#9CA3AF] hover:text-[#F3F4F6] hover:bg-[#1E2030] focus-visible:ring-[#3A3D4A] disabled:opacity-50",
};

const sizeStyles = {
  sm: "px-2.5 py-1.5 text-xs gap-1.5",
  md: "px-4 py-2 text-sm gap-2",
  lg: "px-5 py-2.5 text-sm gap-2",
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
      className={`inline-flex items-center justify-center rounded-lg font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0F1117] disabled:cursor-not-allowed ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
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
