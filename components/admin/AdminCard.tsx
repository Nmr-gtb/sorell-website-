import { type ReactNode } from "react";

interface AdminCardProps {
  children: ReactNode;
  variant?: "default" | "accent" | "danger";
  className?: string;
  padding?: "sm" | "md" | "lg";
  hover?: boolean;
}

const variantStyles = {
  default: "bg-[#1A1C25] border-[#2A2D38]",
  accent: "bg-[#1A1C25] border-teal-800/40",
  danger: "bg-red-950/20 border-red-900/40",
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
      className={`rounded-xl border transition-all duration-200 ${variantStyles[variant]} ${paddingStyles[padding]} ${
        hover ? "hover:border-[#3A3D4A] hover:bg-[#1E2030]" : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}
