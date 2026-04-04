import { type ReactNode } from "react";

interface AdminCardProps {
  children: ReactNode;
  variant?: "default" | "accent" | "danger";
  className?: string;
  padding?: "sm" | "md" | "lg";
  hover?: boolean;
}

const variantStyles = {
  default: "bg-white border-[#E5E7EB]",
  accent: "bg-white border-[#005058]/20",
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
      className={`rounded-xl border shadow-[0_1px_3px_rgba(0,0,0,0.04)] transition-all duration-200 ${variantStyles[variant]} ${paddingStyles[padding]} ${
        hover ? "hover:border-[#D1D5DB] hover:shadow-[0_4px_6px_-1px_rgba(0,0,0,0.07)]" : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}
