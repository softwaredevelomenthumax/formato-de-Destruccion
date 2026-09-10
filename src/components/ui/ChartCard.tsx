import type { ReactNode } from "react";

type ChartCardProps = {
  title: string;
  description: string;
  label: string;
  children: ReactNode;
  className?: string;
};

export default function ChartCard({ title, description, label, children, className = "" }: ChartCardProps) {
  return (
    <section className={`chart-panel chart-card ${className}`}>
      <header className="chart-card-header">
        <div className="chart-card-title-group">
          <span className="chart-card-marker" aria-hidden="true" />
          <div>
            <h2>{title}</h2>
            <p>{description}</p>
          </div>
        </div>
        <span className="chart-kicker">{label}</span>
      </header>
      <div className="chart-card-body">{children}</div>
    </section>
  );
}
