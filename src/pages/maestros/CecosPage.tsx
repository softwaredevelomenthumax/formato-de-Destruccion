import { useState, useMemo } from "react";
import { Building2, Search, Plus, Edit2, Trash2 } from "lucide-react";
import { CECOS_DATA } from "../../data/cecos";
import { Modal, ConfirmModal } from "../../components/ui/Modal";
import { EmptyState } from "../../components/ui/EmptyState";
import { Badge } from "../../components/ui/Badge";
import { EMPRESAS } from "../../constants";
import type { Ceco, Empresa } from "../../types";
import { toast } from "sonner";

export default function CecosPage() {
  const [cecos, setCecos] = useState<Ceco[]>(CECOS_DATA);
  const [search, setSearch] = useState("");
  const [empresaFilter, setEmpresaFilter] = useState<Empresa | "">("");
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<Ceco | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const PAGE_SIZE = 15;

  const [form, setForm] = useState<Ceco>({
    empresaCode: "CO11", empresa: "Humax", ceco: "", denominacion: "", responsable: "", departamento: "", tipoCosto: "F - Production", moneda: "COP", status: "Activo"
  });

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

  const handleSave = () => {
    if (!form.ceco || !form.denominacion || !form.empresa) { toast.error("Complete los campos obligatorios"); return; }
    if (editItem) {
      setCecos((prev) => prev.map((c) => c.ceco === editItem.ceco && c.empresa === editItem.empresa ? form : c));
      toast.success("CeCo actualizado");
    } else {
      setCecos((prev) => [...prev, form]);
      toast.success("CeCo creado");
    }
    setModalOpen(false);
  };

  const handleDelete = (ceco: Ceco) => {
    setCecos((prev) => prev.filter((c) => !(c.ceco === ceco.ceco && c.empresa === ceco.empresa)));
    toast.success("CeCo eliminado");
    setDeleteConfirm(null);
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
                {pageItems.map((c, i) => (
                  <tr key={i} className="hover:bg-slate-50">
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
                        <button onClick={() => setDeleteConfirm(`${c.empresa}-${c.ceco}`)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"><Trash2 size={14} /></button>
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
              {Array.from({ length: Math.min(totalPages, 8) }, (_, i) => i + 1).map((p) => (
                <button key={p} onClick={() => setPage(p)} className={`w-7 h-7 rounded text-xs font-medium ${p === page ? "bg-blue-700 text-white" : "text-slate-600 hover:bg-slate-100"}`}>{p}</button>
              ))}
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
            <input value={form.ceco} onChange={(e) => setForm((p) => ({ ...p, ceco: e.target.value }))} disabled={!!editItem} className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50" />
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
        onConfirm={() => {
          const [emp, ceco] = (deleteConfirm || "").split("-");
          const item = cecos.find((c) => c.empresa === emp && c.ceco === ceco);
          if (item) handleDelete(item);
        }}
        title="Eliminar CeCo"
        message="¿Está seguro de que desea eliminar este centro de costos?"
        confirmLabel="Eliminar" danger
      />
    </div>
  );
}
