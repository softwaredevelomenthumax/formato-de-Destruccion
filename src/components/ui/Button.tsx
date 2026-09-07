import type { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "outline";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  icon?: ReactNode;
  children: ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  icon,
  children,
  className = "",
  disabled,
  ...rest
}: ButtonProps) {
  const sizes = {
    sm: "px-3 py-1.5 text-sm gap-1.5",
    md: "px-4 py-2 text-sm gap-2",
    lg: "px-5 py-2.5 text-base gap-2",
  };
  const variants = {
    primary: "bg-sky-800 text-white hover:bg-sky-900 disabled:bg-sky-300 shadow-[0_6px_14px_rgba(7,89,133,0.18)]",
    secondary: "bg-slate-100 text-slate-700 hover:bg-slate-200 disabled:opacity-50",
    ghost: "bg-transparent text-slate-600 hover:bg-slate-100 disabled:opacity-50",
    danger: "bg-rose-600 text-white hover:bg-rose-700 disabled:bg-rose-300 shadow-[0_6px_14px_rgba(225,29,72,0.16)]",
    outline: "bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 disabled:opacity-50",
  };

  return (
    <button
      className={`inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${sizes[size]} ${variants[variant]} ${className}`}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? (
        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : icon ? (
        <span className="shrink-0">{icon}</span>
      ) : null}
      {children}
    </button>
  );
}
