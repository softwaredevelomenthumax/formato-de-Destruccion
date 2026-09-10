type TooltipPayload = {
  name?: string;
  value?: number | string;
  color?: string;
};

type ChartTooltipProps = {
  active?: boolean;
  label?: string;
  payload?: TooltipPayload[];
  currency?: boolean;
};

export default function ChartTooltip({ active, label, payload, currency = false }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;

  const item = payload[0];
  const value = Number(item.value || 0);
  const formattedValue = currency
    ? `COP ${value.toLocaleString("es-CO")}`
    : value.toLocaleString("es-CO");

  return (
    <div className="chart-tooltip">
      <p className="chart-tooltip-label">{label}</p>
      <div className="chart-tooltip-value">
        <span className="chart-tooltip-dot" style={{ backgroundColor: item.color || "#0F766E" }} />
        <span>{item.name || "Total"}</span>
        <strong>{formattedValue}</strong>
      </div>
    </div>
  );
}
