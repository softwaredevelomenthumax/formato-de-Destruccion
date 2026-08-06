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
      className={`bg-white rounded-xl border border-slate-200 p-5 flex items-start gap-4 ${onClick ? "cursor-pointer hover:shadow-md hover:border-blue-200 transition-all" : ""}`}
      onClick={onClick}
    >
      <div className={`p-2.5 rounded-lg shrink-0 ${iconColor}`}>{icon}</div>
      <div className="min-w-0">
        <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-bold text-slate-900 mt-0.5">{value}</p>
        {delta && (
          <p className={`text-xs mt-1 font-medium ${deltaPositive ? "text-green-600" : "text-red-500"}`}>
            {delta}
          </p>
        )}
      </div>
    </div>
  );
}
