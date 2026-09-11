import { useState, useMemo } from "react";
import { BarChart3, Download, Filter } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LabelList } from "recharts";
import { useApp } from "../../context/AppContext";
import { ActaStatusBadge } from "../../components/ui/Badge";
import ChartTooltip from "../../components/ui/ChartTooltip";
import ChartCard from "../../components/ui/ChartCard";
import { CAUSAL_LABELS, CLASIFICACION_LABELS, EMPRESAS } from "../../constants";
import type { ActaStatus, Empresa } from "../../types";

const COLORS = ["#0F766E", "#0284C7", "#F59E0B", "#E11D48", "#7C3AED", "#0891B2", "#65A30D", "#C026D3"];

function numericValue(value: unknown): number {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

export default function ReportsPage() {
  const { actas } = useApp();
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [empresaFilter, setEmpresaFilter] = useState<Empresa | "">("");
  const [statusFilter, setStatusFilter] = useState<ActaStatus | "">("");

  const filtered = useMemo(() => {
    let list = actas;
    if (fechaDesde) list = list.filter((a) => a.fecha >= fechaDesde);
    if (fechaHasta) list = list.filter((a) => a.fecha <= fechaHasta);
    if (empresaFilter) list = list.filter((a) => a.empresa === empresaFilter);
    if (statusFilter) list = list.filter((a) => a.status === statusFilter);
    return list;
  }, [actas, fechaDesde, fechaHasta, empresaFilter, statusFilter]);

  const totalCosto = filtered.reduce((acc, a) => acc + numericValue(a.costoDestruccion), 0);
  const totalPeso = filtered.reduce((acc, a) => acc + numericValue(a.pesoKg), 0);
  const totalUnidades = filtered.reduce((acc, a) => acc + numericValue(a.cantidadUnidades), 0);

  const byEmpresa = EMPRESAS.map((e) => ({
    name: e,
    total: filtered.filter((a) => a.empresa === e).length,
    costo: filtered.filter((a) => a.empresa === e).reduce((s, a) => s + numericValue(a.costoDestruccion), 0),
  }));

  const byArea = Object.values(filtered.reduce<Record<string, { area: string; total: number; costo: number }>>((acc, acta) => {
    const area = acta.area || "Sin área";
    const current = acc[area] || { area, total: 0, costo: 0 };
    current.total += 1;
    current.costo += numericValue(acta.costoDestruccion);
    acc[area] = current;
    return acc;
  }, {})).sort((a, b) => b.costo - a.costo);

  const byCausal = Object.entries(CAUSAL_LABELS).map(([k, v]) => ({
    name: v,
    total: filtered.filter((a) => a.causal === k).length,
  })).filter((d) => d.total > 0);

  const exportCSV = () => {
    const headers = ["Consecutivo", "Empresa", "Área", "Producto", "Causal", "Clasificación", "Peso (kg)", "Unidades", "Costo", "Estado", "Fecha", "Solicitante"];
    const rows = filtered.map((a) => [
      a.consecutivo, a.empresa, a.area, a.descripcion, CAUSAL_LABELS[a.causal], CLASIFICACION_LABELS[a.clasificacion],
      a.pesoKg, a.cantidadUnidades, a.costoDestruccion, a.status, a.fecha, a.solicitanteNombre
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `reporte-actas-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="mb-1 text-[11px] font-bold uppercase tracking-[0.16em] text-teal-700">Análisis operativo</p>
          <h1 className="text-2xl font-bold text-slate-900">Reportes</h1>
          <p className="text-sm text-slate-500 mt-1">{filtered.length} actas en el reporte · Explora el comportamiento del flujo.</p>
        </div>
        <button onClick={exportCSV} className="flex items-center gap-2 border border-slate-300 bg-white text-slate-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-file-earmark-arrow-down-fill" viewBox="0 0 16 16">
            <path d="M9.293 0H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V4.707A1 1 0 0 0 13.707 4L10 .293A1 1 0 0 0 9.293 0M9.5 3.5v-2l3 3h-2a1 1 0 0 1-1-1m-1 4v3.793l1.146-1.147a.5.5 0 0 1 .708.708l-2 2a.5.5 0 0 1-.708 0l-2-2a.5.5 0 0 1 .708-.708L7.5 11.293V7.5a.5.5 0 0 1 1 0"/>
          </svg> Exportar reportes
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter size={14} className="text-slate-500" />
          <span className="text-sm font-semibold text-slate-700">Filtros</span>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs text-slate-500 mb-1">Fecha desde</label>
            <input type="date" value={fechaDesde} onChange={(e) => setFechaDesde(e.target.value)} className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Fecha hasta</label>
            <input type="date" value={fechaHasta} onChange={(e) => setFechaHasta(e.target.value)} className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Empresa</label>
            <select value={empresaFilter} onChange={(e) => setEmpresaFilter(e.target.value as any)} className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Todas</option>
              {EMPRESAS.map((e) => <option key={e} value={e}>{e}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Estado</label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)} className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Todos</option>
              <option value="aprobada">Aprobada</option>
              <option value="rechazada">Rechazada</option>
              <option value="pendiente_aprobacion_area">Pendiente área</option>
              <option value="pendiente_hse">Pendiente HSE</option>
            </select>
          </div>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total actas", value: filtered.length.toString() },
          { label: "Costo total", value: `COP ${totalCosto.toLocaleString("es-CO")}` },
          { label: "Peso total (kg)", value: totalPeso.toFixed(2) },
          { label: "Total unidades", value: totalUnidades.toLocaleString("es-CO") },
        ].map((s) => (
          <div key={s.label} className="stat-card bg-white rounded-2xl border border-slate-200 p-4">
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">{s.label}</p>
            <p className="text-xl font-bold text-slate-900 mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <ChartCard title="Actas por empresa" description="Volumen y costo asociado" label="Comparativo">
          <div className="chart-visual chart-visual-bar">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={byEmpresa} margin={{ top: 18, right: 18, left: -12, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="#DCEBED" strokeDasharray="2 6" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#647B83" }} padding={{ left: 14, right: 14 }} />
              <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#647B83" }} domain={[0, "dataMax + 1"]} />
              <Tooltip cursor={{ stroke: "#99F6E4", strokeWidth: 1 }} content={<ChartTooltip />} />
              <Line type="monotone" dataKey="total" name="Actas" stroke="#0F766E" strokeWidth={3} dot={{ r: 5, fill: "#0F766E", stroke: "#ffffff", strokeWidth: 2 }} activeDot={{ r: 7, fill: "#0284C7", stroke: "#ffffff", strokeWidth: 3 }} animationDuration={750}>
                <LabelList dataKey="total" position="top" offset={10} fill="#0F766E" fontSize={11} fontWeight={700} />
              </Line>
            </LineChart>
          </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Por causal de destrucción" description="Distribución del motivo registrado" label="Causales">
          <div className="chart-visual chart-visual-donut">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={byCausal} dataKey="total" nameKey="name" cx="50%" cy="50%" innerRadius={58} outerRadius={86} paddingAngle={5} startAngle={90} endAngle={-270} stroke="#F8FBFC" strokeWidth={4}>
                {byCausal.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <text x="50%" y="47%" textAnchor="middle" dominantBaseline="middle" className="fill-slate-900 text-xl font-bold">{filtered.length}</text>
              <text x="50%" y="59%" textAnchor="middle" dominantBaseline="middle" className="fill-slate-500 text-[10px]">actas</text>
              <Tooltip content={<ChartTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          </div>
          <div className="chart-data-legend mt-3 flex flex-wrap gap-2">
            {byCausal.map((d, i) => (
              <div key={d.name} className="flex items-center gap-1 text-xs text-slate-600">
                <div className="w-2 h-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                {d.name}: {d.total}
              </div>
            ))}
          </div>
        </ChartCard>

      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-200 bg-slate-50">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Dinero destruido por área</p>
          <p className="text-xs text-slate-500 mt-1">Contador acumulado de costo de destrucción para los filtros seleccionados.</p>
        </div>
        {byArea.length === 0 ? <p className="p-6 text-center text-sm text-slate-500">No hay costos registrados para mostrar.</p> : <div className="divide-y divide-slate-100">{byArea.map((item) => (
          <div key={item.area} className="flex items-center justify-between gap-4 px-5 py-3">
            <div><p className="text-sm font-semibold text-slate-800">{item.area}</p><p className="text-xs text-slate-500">{item.total} {item.total === 1 ? "acta" : "actas"}</p></div>
            <p className="text-base font-bold text-teal-700">COP {item.costo.toLocaleString("es-CO")}</p>
          </div>
        ))}</div>}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-200 bg-slate-50">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Detalle de actas</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Consecutivo</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Empresa</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Producto</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Causal</th>
                <th className="text-right px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Peso (kg)</th>
                <th className="text-right px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Costo</th>
                <th className="text-left px-4 py-2.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((a) => (
                <tr key={a.id} className="hover:bg-slate-50">
                  <td className="px-4 py-2.5 font-mono text-xs text-blue-700 font-semibold">{a.consecutivo}</td>
                  <td className="px-4 py-2.5 text-slate-600 text-xs">{a.empresa}</td>
                  <td className="px-4 py-2.5 text-slate-800 max-w-xs truncate">{a.descripcion}</td>
                  <td className="px-4 py-2.5 text-slate-500 text-xs">{CAUSAL_LABELS[a.causal]}</td>
                  <td className="px-4 py-2.5 text-right text-slate-700">{numericValue(a.pesoKg)}</td>
                  <td className="px-4 py-2.5 text-right text-slate-700">COP {numericValue(a.costoDestruccion).toLocaleString("es-CO")}</td>
                  <td className="px-4 py-2.5"><ActaStatusBadge status={a.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
