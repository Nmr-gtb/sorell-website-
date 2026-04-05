import { type ReactNode } from "react";

interface AdminCardProps {
  children: ReactNode;
  variant?: "default" | "accent" | "danger";
  className?: string;
  padding?: "sm" | "md" | "lg";
  hover?: boolean;
}

const variantStyles = {
  default: "bg-[var(--surface)] border-[var(--border)]",
  accent: "bg-[var(--surface)] border-[var(--accent-border)]",
  danger: "bg-red-50 border-red-200",
};

const paddingStyles = {
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
};

export default function AdminCard({
  children,
  variant = "default",
  className = "",
  padding = "md",
  hover = false,
}: AdminCardProps) {
  return (
    <div
      className={`rounded-xl border shadow-[var(--shadow-sm)] transition-all duration-200 ${variantStyles[variant]} ${paddingStyles[padding]} ${
        hover ? "hover:border-[var(--border-hover)] hover:shadow-[var(--shadow-md)]" : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}
