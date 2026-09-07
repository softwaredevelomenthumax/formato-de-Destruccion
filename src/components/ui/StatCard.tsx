import type { ReactNode } from "react";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: ReactNode;
  iconColor?: string;
  delta?: string;
  deltaPositive?: boolean;
  onClick?: () => void;
}

export function StatCard({ label, value, icon, iconColor = "bg-blue-50 text-blue-700", delta, deltaPositive, onClick }: StatCardProps) {
  return (
    <div
      className={`stat-card group relative overflow-hidden bg-white rounded-2xl border border-slate-200 p-5 flex items-start gap-4 ${onClick ? "cursor-pointer hover:shadow-xl hover:-translate-y-0.5 hover:border-teal-300 transition-all" : ""}`}
      onClick={onClick}
    >
      <div className={`relative z-10 p-3 rounded-xl shrink-0 transition-transform duration-300 group-hover:scale-110 ${iconColor}`}>{icon}</div>
      <div className="min-w-0">
        <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-[0.08em]">{label}</p>
        <p className="text-3xl font-bold text-slate-900 mt-1 leading-none">{value}</p>
        {delta && (
          <p className={`text-xs mt-1 font-medium ${deltaPositive ? "text-green-600" : "text-red-500"}`}>
            {delta}
          </p>
        )}
      </div>
    </div>
  );
}
