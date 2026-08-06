import { useState, useMemo } from "react";
import { useNavigate } from "react-router";
import { FileText, Plus, Search, Filter, Download, Trash2, Eye } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useApp } from "../../context/AppContext";
import { ActaStatusBadge } from "../../components/ui/Badge";
import { EmptyState } from "../../components/ui/EmptyState";
import { ConfirmModal } from "../../components/ui/Modal";
import { ACTA_STATUS_LABELS, CLASIFICACION_LABELS, CAUSAL_LABELS, EMPRESAS } from "../../constants";
import type { ActaStatus, Empresa } from "../../types";
import { toast } from "sonner";

const STATUS_OPTIONS: { value: ActaStatus | ""; label: string }[] = [
  { value: "", label: "Todos los estados" },
  ...Object.entries(ACTA_STATUS_LABELS).map(([v, l]) => ({ value: v as ActaStatus, label: l })),
];

export default function ActaListPage() {
  const { user } = useAuth();
  const { actas, deleteActa } = useApp();
  const navigate = useNavigate();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ActaStatus | "">("");
  const [empresaFilter, setEmpresaFilter] = useState<Empresa | "">("");
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const PAGE_SIZE = 12;

  const visibleActas = useMemo(() => {
    let list = actas;
    if (user?.rol === "solicitante") list = list.filter((a) => a.solicitanteId === user.id);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((a) =>
        a.consecutivo.toLowerCase().includes(q) ||
        a.descripcion.toLowerCase().includes(q) ||
        a.solicitanteNombre.toLowerCase().includes(q) ||
        a.area.toLowerCase().includes(q) ||
        a.codigoSAP.toLowerCase().includes(q) ||
        a.registroINVIMA.toLowerCase().includes(q)
      );
    }
    if (statusFilter) list = list.filter((a) => a.status === statusFilter);
    if (empresaFilter) list = list.filter((a) => a.empresa === empresaFilter);
    return list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [actas, user, search, statusFilter, empresaFilter]);

  const totalPages = Math.ceil(visibleActas.length / PAGE_SIZE);
  const pageActas = visibleActas.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleDelete = (id: string) => {
    const ok = deleteActa(id);
    if (ok) toast.success("Acta eliminada correctamente");
    else toast.error("No se puede eliminar esta acta");
    setDeleteId(null);
  };

  const canDelete = (status: ActaStatus) => user?.rol === "administrador" && status !== "cerrada";
  const canCreate = user?.rol === "solicitante";

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Actas de Destrucción</h1>
          <p className="text-sm text-slate-500 mt-0.5">{visibleActas.length} acta(s) encontrada(s)</p>
        </div>
        {canCreate && (
          <button onClick={() => navigate("/actas/nueva")} className="bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-800 transition-colors flex items-center gap-2">
            <Plus size={16} /> Nueva Acta
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-48">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Buscar por consecutivo, producto, solicitante..."
              className="pl-8 pr-4 py-2 text-sm border border-slate-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value as ActaStatus | ""); setPage(1); }}
            className="px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <select
            value={empresaFilter}
            onChange={(e) => { setEmpresaFilter(e.target.value as Empresa | ""); setPage(1); }}
            className="px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todas las empresas</option>
            {EMPRESAS.map((e) => <option key={e} value={e}>{e}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {pageActas.length === 0 ? (
          <EmptyState icon={<FileText size={48} />} title="No se encontraron actas"
            description="Intente ajustar los filtros de búsqueda" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Consecutivo</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Descripción</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Empresa</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Solicitante</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Fecha</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Estado</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pageActas.map((acta) => (
                  <tr key={acta.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-blue-700 font-semibold">{acta.consecutivo}</td>
                    <td className="px-4 py-3 max-w-xs">
                      <p className="font-medium text-slate-800 truncate">{acta.descripcion}</p>
                      <p className="text-xs text-slate-500">{CAUSAL_LABELS[acta.causal]}</p>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{acta.empresa}</td>
                    <td className="px-4 py-3 text-slate-600">{acta.solicitanteNombre}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{acta.fecha}</td>
                    <td className="px-4 py-3"><ActaStatusBadge status={acta.status} /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        <button
                          onClick={() => navigate(`/actas/${acta.id}`)}
                          className="p-1.5 text-slate-400 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
                          title="Ver detalle"
                        >
                          <Eye size={15} />
                        </button>
                        {canDelete(acta.status) && (
                          <button
                            onClick={() => setDeleteId(acta.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200">
            <p className="text-xs text-slate-500">Página {page} de {totalPages}</p>
            <div className="flex gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-7 h-7 rounded text-xs font-medium ${p === page ? "bg-blue-700 text-white" : "text-slate-600 hover:bg-slate-100"}`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <ConfirmModal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && handleDelete(deleteId)}
        title="Eliminar acta"
        message="¿Está seguro de que desea eliminar esta acta? Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        danger
      />
    </div>
  );
}
