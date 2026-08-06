import type { ActaStatus } from "../../types";
import { ACTA_STATUS_LABELS, ACTA_STATUS_COLORS } from "../../constants";

interface BadgeProps {
  label: string;
  variant?: "default" | "success" | "warning" | "error" | "info" | "muted";
  size?: "sm" | "md";
}

export function Badge({ label, variant = "default", size = "sm" }: BadgeProps) {
  const base = size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-sm";
  const variants = {
    default: "bg-blue-50 text-blue-700 border border-blue-200",
    success: "bg-green-50 text-green-700 border border-green-200",
    warning: "bg-amber-50 text-amber-700 border border-amber-200",
    error: "bg-red-50 text-red-700 border border-red-200",
    info: "bg-sky-50 text-sky-700 border border-sky-200",
    muted: "bg-slate-100 text-slate-600 border border-slate-200",
  };
  return (
    <span className={`inline-flex items-center font-medium rounded-full ${base} ${variants[variant]}`}>
      {label}
    </span>
  );
}

export function ActaStatusBadge({ status }: { status: ActaStatus }) {
  const colors = ACTA_STATUS_COLORS[status];
  const label = ACTA_STATUS_LABELS[status];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full border ${colors.bg} ${colors.text} ${colors.border}`}>
      {label}
    </span>
  );
}
