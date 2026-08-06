import { useState } from "react";
import { Package, Search, Plus, Edit2, Trash2, AlertCircle } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { Modal, ConfirmModal } from "../../components/ui/Modal";
import { Badge } from "../../components/ui/Badge";
import { EmptyState } from "../../components/ui/EmptyState";
import type { InvimaProduct } from "../../types";
import { toast } from "sonner";

export default function InvimaPage() {
  const { invimaProducts, addInvimaProduct, updateInvimaProduct, deleteInvimaProduct } = useApp();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | "Vigente" | "Vencido" | "Cancelado">("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<InvimaProduct | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const [form, setForm] = useState<Omit<InvimaProduct, "id">>({
    productName: "", registryNumber: "", internalStatus: "Vigente", holder: "Humax", tipoMedicamento: "", controlado: false, presentacion: ""
  });

  const filtered = invimaProducts.filter((p) => {
    const q = search.toLowerCase();
    const match = !q || p.productName.toLowerCase().includes(q) || p.registryNumber.toLowerCase().includes(q) || p.holder.toLowerCase().includes(q);
    return match && (!statusFilter || p.internalStatus === statusFilter);
  });

  const openCreate = () => {
    setEditItem(null);
    setForm({ productName: "", registryNumber: "", internalStatus: "Vigente", holder: "Humax", tipoMedicamento: "", controlado: false, presentacion: "" });
    setModalOpen(true);
  };

  const openEdit = (item: InvimaProduct) => {
    setEditItem(item);
    setForm({ productName: item.productName, registryNumber: item.registryNumber, internalStatus: item.internalStatus, holder: item.holder, tipoMedicamento: item.tipoMedicamento, controlado: item.controlado, presentacion: item.presentacion || "" });
    setModalOpen(true);
  };

  const handleSave = () => {
    if (!form.productName || !form.registryNumber) { toast.error("Nombre y número de registro son obligatorios"); return; }
    if (editItem) {
      updateInvimaProduct(editItem.id, form);
      toast.success("Registro INVIMA actualizado");
    } else {
      addInvimaProduct(form);
      toast.success("Registro INVIMA creado");
    }
    setModalOpen(false);
  };

  const statusVariant = (s: string) => s === "Vigente" ? "success" : s === "Vencido" ? "error" : "muted";

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Maestro de Registros INVIMA</h1>
          <p className="text-sm text-slate-500 mt-0.5">{filtered.length} registros</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-700 px-3 py-1.5 rounded-lg text-xs font-medium">
            <AlertCircle size={13} /> Módulo temporal — pendiente de configuración definitiva
          </div>
          <button onClick={openCreate} className="flex items-center gap-2 bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-800">
            <Plus size={16} /> Nuevo Registro
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por producto o número de registro..."
            className="pl-8 pr-4 py-2 text-sm border border-slate-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)} className="px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">Todos los estados</option>
          <option value="Vigente">Vigente</option>
          <option value="Vencido">Vencido</option>
          <option value="Cancelado">Cancelado</option>
        </select>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {filtered.length === 0 ? (
          <EmptyState icon={<Package size={48} />} title="No se encontraron registros" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Producto</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Número de Registro</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Estado</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Titular</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Tipo</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Controlado</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-800">{p.productName}</p>
                      {p.presentacion && <p className="text-xs text-slate-500">{p.presentacion}</p>}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-700">{p.registryNumber}</td>
                    <td className="px-4 py-3">
                      <Badge label={p.internalStatus} variant={statusVariant(p.internalStatus) as any} />
                    </td>
                    <td className="px-4 py-3 text-slate-600">{p.holder}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs">{p.tipoMedicamento}</td>
                    <td className="px-4 py-3">
                      {p.controlado && <Badge label="Controlado" variant="error" />}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 justify-end">
                        <button onClick={() => openEdit(p)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded"><Edit2 size={14} /></button>
                        <button onClick={() => setDeleteConfirm(p.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? "Editar Registro INVIMA" : "Nuevo Registro INVIMA"} size="md"
        footer={
          <>
            <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg font-medium">Cancelar</button>
            <button onClick={handleSave} className="px-5 py-2 text-sm font-semibold bg-blue-700 text-white rounded-lg hover:bg-blue-800">Guardar</button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">Nombre del Producto *</label>
            <input value={form.productName} onChange={(e) => setForm((p) => ({ ...p, productName: e.target.value }))} className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Número de Registro *</label>
            <input value={form.registryNumber} onChange={(e) => setForm((p) => ({ ...p, registryNumber: e.target.value }))} disabled={!!editItem} className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Estado Interno</label>
            <select value={form.internalStatus} onChange={(e) => setForm((p) => ({ ...p, internalStatus: e.target.value as any }))} className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option>Vigente</option><option>Vencido</option><option>Cancelado</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Titular</label>
            <select value={form.holder} onChange={(e) => setForm((p) => ({ ...p, holder: e.target.value }))} className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option>Humax</option><option>Farmatech</option><option>Cambridge</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de Medicamento</label>
            <input value={form.tipoMedicamento} onChange={(e) => setForm((p) => ({ ...p, tipoMedicamento: e.target.value }))} className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">Presentación</label>
            <input value={form.presentacion} onChange={(e) => setForm((p) => ({ ...p, presentacion: e.target.value }))} placeholder="Ej: Tabletas recubiertas x 500 mg" className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="col-span-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.controlado} onChange={(e) => setForm((p) => ({ ...p, controlado: e.target.checked }))} className="w-4 h-4 text-blue-600 rounded border-slate-300" />
              <span className="text-sm font-medium text-slate-700">¿Es sustancia controlada?</span>
            </label>
          </div>
        </div>
      </Modal>

      <ConfirmModal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)}
        onConfirm={() => { if (deleteConfirm) { deleteInvimaProduct(deleteConfirm); toast.success("Registro eliminado"); setDeleteConfirm(null); } }}
        title="Eliminar Registro INVIMA" message="¿Está seguro de eliminar este registro?" confirmLabel="Eliminar" danger />
    </div>
  );
}
