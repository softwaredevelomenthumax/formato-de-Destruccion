import { useState, useMemo } from "react";
import { BarChart3, Download, Filter } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { useApp } from "../../context/AppContext";
import { ActaStatusBadge } from "../../components/ui/Badge";
import { CAUSAL_LABELS, CLASIFICACION_LABELS, EMPRESAS } from "../../constants";
import type { ActaStatus, Empresa } from "../../types";

const COLORS = ["#0F766E", "#0369A1", "#D97706", "#E11D48", "#7C3AED", "#0891B2", "#65A30D", "#C026D3"];

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

  const byCausal = Object.entries(CAUSAL_LABELS).map(([k, v]) => ({
    name: v,
    total: filtered.filter((a) => a.causal === k).length,
  })).filter((d) => d.total > 0);

  const byClasificacion = Object.entries(CLASIFICACION_LABELS).map(([k, v]) => ({
    name: v,
    total: filtered.filter((a) => a.clasificacion === k).length,
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
        <div className="chart-panel bg-white rounded-2xl border border-slate-200 p-5">
          <div className="mb-4 flex items-start justify-between gap-3"><div><h3 className="text-sm font-semibold text-slate-800">Actas por empresa</h3><p className="mt-1 text-xs text-slate-500">Volumen y costo asociado</p></div><span className="chart-kicker">Comparativo</span></div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={byEmpresa}>
              <defs><linearGradient id="reportCompanyBar" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#14B8A6" /><stop offset="100%" stopColor="#0369A1" /></linearGradient></defs>
              <CartesianGrid vertical={false} strokeDasharray="4 4" stroke="#E2E8F0" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#64748B" }} />
              <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#64748B" }} />
              <Tooltip cursor={{ fill: "rgba(20,184,166,0.08)" }} formatter={(v, n) => n === "costo" ? `COP ${Number(v).toLocaleString("es-CO")}` : v} contentStyle={{ borderRadius: 12, border: "1px solid #CCFBF1", boxShadow: "0 10px 24px rgba(15,23,42,0.12)", fontSize: 12 }} />
              <Bar dataKey="total" fill="url(#reportCompanyBar)" radius={[6, 6, 0, 0]} maxBarSize={48} name="Actas" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="chart-panel bg-white rounded-2xl border border-slate-200 p-5">
          <div className="mb-2 flex items-start justify-between gap-3"><div><h3 className="text-sm font-semibold text-slate-800">Por causal de destrucción</h3><p className="mt-1 text-xs text-slate-500">Distribución del motivo registrado</p></div><span className="chart-kicker">Causales</span></div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={byCausal} dataKey="total" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={82} paddingAngle={3} stroke="none">
                {byCausal.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #CCFBF1", boxShadow: "0 10px 24px rgba(15,23,42,0.12)", fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-2 flex flex-wrap gap-2">
            {byCausal.map((d, i) => (
              <div key={d.name} className="flex items-center gap-1 text-xs text-slate-600">
                <div className="w-2 h-2 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
                {d.name}: {d.total}
              </div>
            ))}
          </div>
        </div>

        <div className="chart-panel bg-white rounded-2xl border border-slate-200 p-5 lg:col-span-2">
          <div className="mb-4 flex items-start justify-between gap-3"><div><h3 className="text-sm font-semibold text-slate-800">Por clasificación de material</h3><p className="mt-1 text-xs text-slate-500">Cantidad de actas por categoría</p></div><span className="chart-kicker">Materiales</span></div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={byClasificacion} layout="vertical">
              <defs><linearGradient id="reportMaterialBar" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#0F766E" /><stop offset="100%" stopColor="#0EA5E9" /></linearGradient></defs>
              <CartesianGrid horizontal={false} strokeDasharray="4 4" stroke="#E2E8F0" />
              <XAxis type="number" allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#64748B" }} />
              <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#64748B" }} width={150} />
              <Tooltip cursor={{ fill: "rgba(20,184,166,0.08)" }} contentStyle={{ borderRadius: 12, border: "1px solid #CCFBF1", boxShadow: "0 10px 24px rgba(15,23,42,0.12)", fontSize: 12 }} />
              <Bar dataKey="total" fill="url(#reportMaterialBar)" radius={[0, 6, 6, 0]} maxBarSize={26} name="Actas" />
            </BarChart>
          </ResponsiveContainer>
        </div>
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
