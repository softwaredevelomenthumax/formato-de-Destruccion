import { useState, useMemo, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router";
import { Search, Eye } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { ActaStatusBadge } from "../../components/ui/Badge";
import { EmptyState } from "../../components/ui/EmptyState";
import { CAUSAL_LABELS, CLASIFICACION_LABELS, EMPRESAS } from "../../constants";
import type { ActaStatus, Empresa } from "../../types";

export default function SearchPage() {
  const { actas } = useApp();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [empresa, setEmpresa] = useState<Empresa | "">("");
  const [status, setStatus] = useState<ActaStatus | "">("");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [costoMin, setCostoMin] = useState("");
  const [costoMax, setCostoMax] = useState("");
  const [pesoMin, setPesoMin] = useState("");
  const [pesoMax, setPesoMax] = useState("");
  const [controlada, setControlada] = useState<"" | "si" | "no">("");
  const [searched, setSearched] = useState(!!searchParams.get("q"));

  useEffect(() => {
    const q = searchParams.get("q");
    if (q) { setQuery(q); setSearched(true); }
  }, [searchParams]);

  const results = useMemo(() => {
    if (!searched) return [];
    let list = actas;
    const q = query.toLowerCase().trim();
    if (q) {
      list = list.filter((a) =>
        a.consecutivo.toLowerCase().includes(q) ||
        a.descripcion.toLowerCase().includes(q) ||
        a.solicitanteNombre.toLowerCase().includes(q) ||
        a.area.toLowerCase().includes(q) ||
        a.empresa.toLowerCase().includes(q) ||
        a.codigoSAP.toLowerCase().includes(q) ||
        a.registroINVIMA.toLowerCase().includes(q) ||
        a.centroCostos.toLowerCase().includes(q) ||
        a.numeroLote.toLowerCase().includes(q) ||
        a.ordenProduccion.toLowerCase().includes(q) ||
        CAUSAL_LABELS[a.causal].toLowerCase().includes(q) ||
        CLASIFICACION_LABELS[a.clasificacion].toLowerCase().includes(q)
      );
    }
    if (empresa) list = list.filter((a) => a.empresa === empresa);
    if (status) list = list.filter((a) => a.status === status);
    if (fechaDesde) list = list.filter((a) => a.fecha >= fechaDesde);
    if (fechaHasta) list = list.filter((a) => a.fecha <= fechaHasta);
    if (costoMin) list = list.filter((a) => a.costoDestruccion >= parseFloat(costoMin));
    if (costoMax) list = list.filter((a) => a.costoDestruccion <= parseFloat(costoMax));
    if (pesoMin) list = list.filter((a) => a.pesoKg >= parseFloat(pesoMin));
    if (pesoMax) list = list.filter((a) => a.pesoKg <= parseFloat(pesoMax));
    if (controlada === "si") list = list.filter((a) => a.sustanciaControlada);
    if (controlada === "no") list = list.filter((a) => !a.sustanciaControlada);
    return list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [actas, searched, query, empresa, status, fechaDesde, fechaHasta, costoMin, costoMax, pesoMin, pesoMax, controlada]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearched(true);
    if (query) setSearchParams({ q: query });
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Búsqueda Global</h1>
        <p className="text-sm text-slate-500 mt-0.5">Busque actas por cualquier campo</p>
      </div>

      <form onSubmit={handleSearch} className="bg-white rounded-xl border border-slate-200 p-5">
        <div className="relative mb-4">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por consecutivo, producto, lote, SAP, INVIMA, solicitante, área..."
            className="w-full pl-11 pr-4 py-3 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
          />
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          <div>
            <label className="block text-xs text-slate-500 mb-1">Empresa</label>
            <select value={empresa} onChange={(e) => setEmpresa(e.target.value as any)} className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Todas</option>
              {EMPRESAS.map((e) => <option key={e} value={e}>{e}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Estado</label>
            <select value={status} onChange={(e) => setStatus(e.target.value as any)} className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Todos</option>
              <option value="borrador">Borrador</option>
              <option value="pendiente_aprobacion_area">Pendiente área</option>
              <option value="aprobada">Aprobada</option>
              <option value="rechazada">Rechazada</option>
              <option value="devuelta_ajustes">Devuelta</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Fecha desde</label>
            <input type="date" value={fechaDesde} onChange={(e) => setFechaDesde(e.target.value)} className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Fecha hasta</label>
            <input type="date" value={fechaHasta} onChange={(e) => setFechaHasta(e.target.value)} className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Costo mín (COP)</label>
            <input type="number" value={costoMin} onChange={(e) => setCostoMin(e.target.value)} placeholder="0" className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Costo máx (COP)</label>
            <input type="number" value={costoMax} onChange={(e) => setCostoMax(e.target.value)} placeholder="Sin límite" className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Peso mín (kg)</label>
            <input type="number" value={pesoMin} onChange={(e) => setPesoMin(e.target.value)} placeholder="0" className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Sustancia controlada</label>
            <select value={controlada} onChange={(e) => setControlada(e.target.value as any)} className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Todas</option>
              <option value="si">Sí</option>
              <option value="no">No</option>
            </select>
          </div>
        </div>

        <button type="submit" className="bg-blue-700 text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-800 transition-colors flex items-center gap-2">
          <Search size={15} /> Buscar
        </button>
      </form>

      {searched && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-200 bg-slate-50">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{results.length} resultado(s)</p>
          </div>
          {results.length === 0 ? (
            <EmptyState icon={<Search size={48} />} title="Sin resultados" description="No se encontraron actas que coincidan con los criterios de búsqueda" />
          ) : (
            <div className="divide-y divide-slate-100">
              {results.map((acta) => (
                <div key={acta.id} className="flex items-center gap-4 px-5 py-3 hover:bg-slate-50 cursor-pointer" onClick={() => navigate(`/actas/${acta.id}`)}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-blue-700">{acta.consecutivo}</span>
                      <ActaStatusBadge status={acta.status} />
                      {acta.sustanciaControlada && <span className="text-xs text-red-600 font-medium bg-red-50 px-1.5 py-0.5 rounded border border-red-200">Controlada</span>}
                    </div>
                    <p className="text-sm font-medium text-slate-800 mt-0.5 truncate">{acta.descripcion}</p>
                    <div className="flex gap-3 mt-1 text-xs text-slate-500 flex-wrap">
                      <span>{acta.empresa}</span>
                      <span>·</span>
                      <span>{acta.area}</span>
                      <span>·</span>
                      <span>{CAUSAL_LABELS[acta.causal]}</span>
                      <span>·</span>
                      <span>{acta.fecha}</span>
                      <span>·</span>
                      <span>COP {acta.costoDestruccion.toLocaleString("es-CO")}</span>
                    </div>
                  </div>
                  <button className="p-1.5 text-slate-400 hover:text-blue-700 hover:bg-blue-50 rounded shrink-0">
                    <Eye size={15} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
