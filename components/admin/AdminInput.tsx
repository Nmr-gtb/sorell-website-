import { type InputHTMLAttributes, type SelectHTMLAttributes, type ReactNode, forwardRef } from "react";
import { SearchIcon } from "./AdminIcons";

interface AdminInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: ReactNode;
}

export const AdminInput = forwardRef<HTMLInputElement, AdminInputProps>(
  function AdminInput({ label, icon, className = "", ...props }, ref) {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={props.id} className="text-sm font-medium text-[#374151]">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-[#9CA3AF]">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={`w-full rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-sm text-[#111827] placeholder-[#9CA3AF] transition-colors duration-150 focus:border-[#005058]/50 focus:outline-none focus:ring-2 focus:ring-[#005058]/10 hover:border-[#D1D5DB] ${
              icon ? "pl-10" : ""
            } ${className}`}
            {...props}
          />
        </div>
      </div>
    );
  }
);

interface AdminSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string; label: string }[];
}

export function AdminSelect({ label, options, className = "", ...props }: AdminSelectProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={props.id} className="text-sm font-medium text-[#374151]">
          {label}
        </label>
      )}
      <select
        className={`w-full appearance-none rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 pr-9 text-sm text-[#111827] transition-colors duration-150 focus:border-[#005058]/50 focus:outline-none focus:ring-2 focus:ring-[#005058]/10 hover:border-[#D1D5DB] bg-[url('data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%239CA3AF%22%20stroke-width%3D%222%22%3E%3Cpath%20d%3D%22m6%209%206%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[center_right_0.5rem] ${className}`}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

interface AdminSearchInputProps extends InputHTMLAttributes<HTMLInputElement> {
  onSearch?: (value: string) => void;
}

export function AdminSearchInput({ className = "", ...props }: AdminSearchInputProps) {
  return (
    <AdminInput
      icon={<SearchIcon size={16} />}
      className={className}
      {...props}
    />
  );
}
