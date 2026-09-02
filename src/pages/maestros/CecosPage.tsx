import { useState, useMemo, useEffect } from "react";
import { Navigate } from "react-router";
import { Building2, Search, Plus, Edit2, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { Modal, ConfirmModal } from "../../components/ui/Modal";
import { EmptyState } from "../../components/ui/EmptyState";
import { Badge } from "../../components/ui/Badge";
import { EMPRESAS } from "../../constants";
import type { Ceco, Empresa } from "../../types";
import { toast } from "sonner";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../services/api.ts";

const EMPRESA_CODES: Record<Empresa, string> = { Humax: "CO11", Farmatech: "CO12", Cambridge: "CO13" };

export default function CecosPage() {
  const { user } = useAuth();
  const [cecos, setCecos] = useState<Ceco[]>([]);
  const [search, setSearch] = useState("");
  const [empresaFilter, setEmpresaFilter] = useState<Empresa | "">("");
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<Ceco | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Ceco | null>(null);
  const PAGE_SIZE = 15;

  const [form, setForm] = useState<Ceco>({
    empresaCode: "CO11", empresa: "Humax", ceco: "", denominacion: "", responsable: "", departamento: "", tipoCosto: "F - Production", moneda: "COP", status: "Activo"
  });

  useEffect(() => {
    api.getCecos().then((data: unknown) => {
      if (Array.isArray(data) && data.length > 0) setCecos(data);
    }).catch(() => {
      toast.error("No se pudo cargar el maestro de CeCos desde la base de datos");
    });
  }, []);

  if (user?.rol !== "costos") return <Navigate to="/dashboard" replace />;

  const filtered = useMemo(() => {
    let list = cecos;
    if (empresaFilter) list = list.filter((c) => c.empresa === empresaFilter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((c) =>
        c.ceco.toLowerCase().includes(q) ||
        c.denominacion.toLowerCase().includes(q) ||
        c.responsable.toLowerCase().includes(q) ||
        c.departamento.toLowerCase().includes(q)
      );
    }
    return list;
  }, [cecos, search, empresaFilter]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const firstVisible = filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const lastVisible = Math.min(page * PAGE_SIZE, filtered.length);

  useEffect(() => {
    const lastPage = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    if (page > lastPage) setPage(lastPage);
  }, [filtered.length, page]);

  const openCreate = () => {
    setEditItem(null);
    setForm({ empresaCode: "CO11", empresa: "Humax", ceco: "", denominacion: "", responsable: "", departamento: "", tipoCosto: "F - Production", moneda: "COP", status: "Activo" });
    setModalOpen(true);
  };

  const openEdit = (item: Ceco) => {
    setEditItem(item);
    setForm({ ...item });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.ceco || !form.denominacion || !form.empresa) { toast.error("Complete los campos obligatorios"); return; }
    try {
      const data = { ...form, empresaCode: EMPRESA_CODES[form.empresa] };
      if (editItem) {
        if (!editItem.id) throw new Error("El CeCo no tiene un id de base de datos");
        await api.updateCeco(editItem.id, data);
        setCecos((prev) => prev.map((c) => c.ceco === editItem.ceco && c.empresaCode === editItem.empresaCode ? data : c));
        toast.success("CeCo actualizado");
      } else {
        const created = await api.createCeco(data);
        setCecos((prev) => [...prev, created]);
        toast.success("CeCo creado");
      }
      setModalOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo guardar el CeCo");
    }
  };

  const handleDelete = async (ceco: Ceco) => {
    try {
      if (!ceco.id) throw new Error("El CeCo no tiene un id de base de datos");
      await api.deleteCeco(ceco.id);
      setCecos((prev) => prev.filter((c) => !(c.ceco === ceco.ceco && c.empresaCode === ceco.empresaCode)));
      toast.success("CeCo eliminado");
      setDeleteConfirm(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo eliminar el CeCo");
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Maestro de Centros de Costos</h1>
          <p className="text-sm text-slate-500 mt-0.5">{filtered.length} registros</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-800">
          <Plus size={16} /> Nuevo CeCo
        </button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} placeholder="Buscar por CeCo, denominación, responsable..."
            className="pl-8 pr-4 py-2 text-sm border border-slate-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <select value={empresaFilter} onChange={(e) => { setEmpresaFilter(e.target.value as Empresa | ""); setPage(1); }} className="px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">Todas las empresas</option>
          {EMPRESAS.map((e) => <option key={e} value={e}>{e}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {pageItems.length === 0 ? (
          <EmptyState icon={<Building2 size={48} />} title="No se encontraron registros" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Empresa</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">CeCo</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Denominación</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Responsable</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Departamento</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Estado</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pageItems.map((c) => (
                  <tr key={c.id || `${c.empresaCode}-${c.ceco}`} className="hover:bg-slate-50">
                    <td className="px-4 py-2.5 text-slate-600 text-xs font-medium">{c.empresa}</td>
                    <td className="px-4 py-2.5 font-mono text-xs text-blue-700 font-semibold">{c.ceco}</td>
                    <td className="px-4 py-2.5 font-medium text-slate-800">{c.denominacion}</td>
                    <td className="px-4 py-2.5 text-slate-600">{c.responsable}</td>
                    <td className="px-4 py-2.5 text-slate-500 text-xs">{c.departamento}</td>
                    <td className="px-4 py-2.5">
                      <Badge label={c.status} variant={c.status === "Activo" ? "success" : "muted"} />
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="flex gap-1 justify-end">
                        <button onClick={() => openEdit(c)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded"><Edit2 size={14} /></button>
                        <button onClick={() => setDeleteConfirm(c)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between gap-4 px-4 py-3 border-t border-slate-200">
            <p className="text-xs text-slate-500">
              Mostrando {firstVisible}-{lastVisible} de {filtered.length} registros · Página {page} de {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={page === 1}
                aria-label="Página anterior"
                title="Página anterior"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                disabled={page === totalPages}
                aria-label="Página siguiente"
                title="Página siguiente"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? "Editar CeCo" : "Nuevo Centro de Costos"} size="md"
        footer={
          <>
            <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg font-medium">Cancelar</button>
            <button onClick={handleSave} className="px-5 py-2 text-sm font-semibold bg-blue-700 text-white rounded-lg hover:bg-blue-800">Guardar</button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Empresa *</label>
            <select value={form.empresa} onChange={(e) => setForm((p) => ({ ...p, empresa: e.target.value as Empresa }))} className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
              {EMPRESAS.map((e) => <option key={e} value={e}>{e}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Código CeCo *</label>
            <input value={form.ceco} onChange={(e) => setForm((p) => ({ ...p, ceco: e.target.value }))} disabled={!!editItem} className="w-full px-3 py-2 text-sm border border-blue-200 rounded-lg bg-blue-50 text-blue-800 font-medium cursor-not-allowed pointer-events-none focus:outline-none" />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">Denominación *</label>
            <input value={form.denominacion} onChange={(e) => setForm((p) => ({ ...p, denominacion: e.target.value }))} className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Responsable</label>
            <input value={form.responsable} onChange={(e) => setForm((p) => ({ ...p, responsable: e.target.value }))} className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Departamento</label>
            <input value={form.departamento} onChange={(e) => setForm((p) => ({ ...p, departamento: e.target.value }))} className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Moneda</label>
            <select value={form.moneda} onChange={(e) => setForm((p) => ({ ...p, moneda: e.target.value }))} className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option>COP</option><option>USD</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Estado</label>
            <select value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value as "Activo" | "Inactivo" }))} className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option>Activo</option><option>Inactivo</option>
            </select>
          </div>
        </div>
      </Modal>

      <ConfirmModal
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={() => { if (deleteConfirm) handleDelete(deleteConfirm); }}
        title="Eliminar CeCo"
        message="¿Está seguro de que desea eliminar este centro de costos?"
        confirmLabel="Eliminar" danger
      />
    </div>
  );
}
