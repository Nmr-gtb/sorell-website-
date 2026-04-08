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
  danger: "bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800/40",
};

const paddingStyles = {
  sm: "p-5",
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
      className={`rounded-[20px] border shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-all duration-200 ${variantStyles[variant]} ${paddingStyles[padding]} ${
        hover ? "hover:border-[var(--border-hover)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] hover:-translate-y-[1px]" : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}
