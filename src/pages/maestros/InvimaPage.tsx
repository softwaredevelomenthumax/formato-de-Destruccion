import { useState } from "react";
import { Navigate } from "react-router";
import { Package, Search, Plus, Edit2, Trash2, AlertCircle } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { Modal, ConfirmModal } from "../../components/ui/Modal";
import { Badge } from "../../components/ui/Badge";
import { EmptyState } from "../../components/ui/EmptyState";
import type { InvimaProduct } from "../../types";
import { toast } from "sonner";
import { useAuth } from "../../context/AuthContext";
import { EMPRESAS } from "../../constants";

export default function InvimaPage() {
  const { user } = useAuth();
  const { invimaProducts, addInvimaProduct, updateInvimaProduct, deleteInvimaProduct } = useApp();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [empresaFilter, setEmpresaFilter] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<InvimaProduct | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const standardStatuses = ["Vigente", "Vencido", "Cancelado"];

  const [form, setForm] = useState<Omit<InvimaProduct, "id">>({
    fabricante: "", clase: "", estatusSap: "Activo", codigo: "", productName: "", canal: "", registryNumber: "", estadoInvima: "Vigente", internalStatus: "Vigente", holder: "Humax", empresa: "Humax", empresaCode: "CO11", tipoMedicamento: "", controlado: false, presentacion: "", requiereSap: true, requiereInvima: true
  });

  if (user?.rol !== "planeacion") return <Navigate to="/dashboard" replace />;

  const filtered = invimaProducts.filter((p) => {
    const q = search.toLowerCase();
    const status = p.estadoInvima || p.internalStatus || "";
    const match = !q || p.productName.toLowerCase().includes(q) || p.registryNumber.toLowerCase().includes(q) || (p.codigo || "").toLowerCase().includes(q) || (p.fabricante || p.holder).toLowerCase().includes(q);
    const statusMatch = !statusFilter || (statusFilter === "Otro" ? !standardStatuses.includes(status) : status === statusFilter);
    return match && statusMatch && (!empresaFilter || p.empresa === empresaFilter);
  });

  const openCreate = () => {
    setEditItem(null);
    setForm({ fabricante: "", clase: "", estatusSap: "Activo", codigo: "", productName: "", canal: "", registryNumber: "", estadoInvima: "Vigente", internalStatus: "Vigente", holder: "Humax", empresa: "Humax", empresaCode: "CO11", tipoMedicamento: "", controlado: false, presentacion: "", requiereSap: true, requiereInvima: true });
    setModalOpen(true);
  };

  const openEdit = (item: InvimaProduct) => {
    setEditItem(item);
    setForm({ fabricante: item.fabricante || "", clase: item.clase || "", estatusSap: item.estatusSap || "Activo", codigo: item.codigo || "", productName: item.productName, canal: item.canal || "", registryNumber: item.registryNumber, estadoInvima: item.estadoInvima || item.internalStatus || "Vigente", internalStatus: item.internalStatus || item.estadoInvima || "Vigente", holder: item.holder, empresa: EMPRESAS.includes(item.empresa as typeof EMPRESAS[number]) ? item.empresa : "Humax", empresaCode: item.empresaCode || "CO11", tipoMedicamento: item.tipoMedicamento, controlado: item.controlado, presentacion: item.presentacion || "", requiereSap: item.requiereSap ?? true, requiereInvima: item.requiereInvima ?? true });
    setModalOpen(true);
  };

  const handleSave = () => {
    if (!form.productName || !form.registryNumber) { toast.error("Nombre y número de registro son obligatorios"); return; }
    const estadoInvima = form.estadoInvima || "";
    if (!standardStatuses.includes(estadoInvima) && !estadoInvima.trim()) {
      toast.error("Escriba el estado INVIMA personalizado");
      return;
    }
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
          <h1 className="text-xl font-bold text-slate-900">Maestro Unificado de Materiales</h1>
          <p className="text-sm text-slate-500 mt-0.5">{filtered.length} registros</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 text-amber-700 px-3 py-1.5 rounded-lg text-xs font-medium">
            <AlertCircle size={13} /> Módulo temporal — pendiente de configuración definitiva del maestro unificado
          </div>
          <button onClick={openCreate} className="flex items-center gap-2 bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-800">
            <Plus size={16} /> Nuevo Registro
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por código SAP, INVIMA o descripción..."
            className="pl-8 pr-4 py-2 text-sm border border-slate-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)} className="px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">Todos los estados</option>
          <option value="Vigente">Vigente</option>
          <option value="Vencido">Vencido</option>
          <option value="Cancelado">Cancelado</option>
          <option value="Otro">Otro</option>
        </select>
        <select value={empresaFilter} onChange={(e) => setEmpresaFilter(e.target.value)} className="px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">Todas las empresas</option>
          {EMPRESAS.map((empresa) => <option key={empresa}>{empresa}</option>)}
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
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Fabricante</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Clase</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Estado SAP</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Código SAP</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Descripción</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Canal</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Código INVIMA</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Estado INVIMA</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Controlado / No controlado</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-600">{p.fabricante || p.holder}</td>
                    <td className="px-4 py-3 text-slate-600">{p.clase || p.tipoMedicamento}</td>
                    <td className="px-4 py-3"><Badge label={p.estatusSap || "Activo"} variant={p.estatusSap === "Inactivo" ? "muted" : "success"} /></td>
                    <td className="px-4 py-3 font-mono text-xs text-blue-700 font-semibold">{p.codigo || "N/A"}</td>
                    <td className="px-4 py-3"><p className="font-medium text-slate-800">{p.productName}</p>{p.presentacion && <p className="text-xs text-slate-500">{p.presentacion}</p>}</td>
                    <td className="px-4 py-3 text-slate-600">{p.canal || "N/A"}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-700">{p.registryNumber || "N/A"}</td>
                    <td className="px-4 py-3"><Badge label={p.estadoInvima || p.internalStatus} variant={statusVariant(p.estadoInvima || p.internalStatus) as any} /></td>
                    <td className="px-4 py-3"><Badge label={p.controlado ? "Controlado" : "No controlado"} variant={p.controlado ? "error" : "success"} /></td>
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

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? "Editar Material" : "Nuevo Material"} size="lg"
        footer={
          <>
            <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg font-medium">Cancelar</button>
            <button onClick={handleSave} className="px-5 py-2 text-sm font-semibold bg-blue-700 text-white rounded-lg hover:bg-blue-800">Guardar</button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Fabricante</label>
            <input value={form.fabricante} onChange={(e) => setForm((p) => ({ ...p, fabricante: e.target.value }))} className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Clase</label>
            <input value={form.clase} onChange={(e) => setForm((p) => ({ ...p, clase: e.target.value }))} placeholder="Ej: SYRUPS, TABLETS" className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Estado del código SAP</label>
            <select value={form.estatusSap} onChange={(e) => setForm((p) => ({ ...p, estatusSap: e.target.value as "Activo" | "Inactivo" }))} className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"><option>Activo</option><option>Inactivo</option></select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Código SAP</label>
            <input value={form.codigo} onChange={(e) => setForm((p) => ({ ...p, codigo: e.target.value }))} placeholder="Ingrese únicamente el código SAP" className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg" />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">Descripción *</label>
            <input value={form.productName} onChange={(e) => setForm((p) => ({ ...p, productName: e.target.value }))} className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Canal</label>
            <input value={form.canal} onChange={(e) => setForm((p) => ({ ...p, canal: e.target.value }))} placeholder="Institucional o Comercial" className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Empresa</label>
            <select value={form.empresa} onChange={(e) => setForm((p) => ({ ...p, empresa: e.target.value as any, empresaCode: e.target.value === "Humax" ? "CO11" : e.target.value === "Farmatech" ? "CO12" : "CO13" }))} className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white">
              {EMPRESAS.map((empresa) => <option key={empresa}>{empresa}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Código INVIMA</label>
            <input value={form.registryNumber} onChange={(e) => setForm((p) => ({ ...p, registryNumber: e.target.value }))} disabled={!!editItem} placeholder="Ingrese código INVIMA" className="w-full px-3 py-2 text-sm border border-blue-200 rounded-lg bg-blue-50 text-blue-800 font-medium cursor-not-allowed pointer-events-none focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Estado INVIMA</label>
            <select
              value={standardStatuses.includes(form.estadoInvima || "") ? form.estadoInvima : "Otro"}
              onChange={(e) => setForm((p) => ({
                ...p,
                estadoInvima: e.target.value === "Otro" ? "" : e.target.value,
                internalStatus: e.target.value === "Otro" ? "" : e.target.value,
              }))}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option>Vigente</option><option>Vencido</option><option>Cancelado</option><option>Otro</option>
            </select>
            {!standardStatuses.includes(form.estadoInvima || "") && (
              <input
                value={form.estadoInvima}
                onChange={(e) => setForm((p) => ({ ...p, estadoInvima: e.target.value, internalStatus: e.target.value }))}
                placeholder="Escriba el estado INVIMA"
                className="mt-2 w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            )}
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
            <label className="block text-sm font-medium text-slate-700 mb-1">Controlado / No controlado</label>
            <select value={form.controlado ? "controlado" : "no_controlado"} onChange={(e) => setForm((p) => ({ ...p, controlado: e.target.value === "controlado" }))} className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="no_controlado">No controlado</option>
              <option value="controlado">Controlado</option>
            </select>
          </div>
        </div>
      </Modal>

      <ConfirmModal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)}
        onConfirm={() => { if (deleteConfirm) { deleteInvimaProduct(deleteConfirm); toast.success("Registro eliminado"); setDeleteConfirm(null); } }}
        title="Eliminar Registro INVIMA" message="¿Está seguro de eliminar este registro?" confirmLabel="Eliminar" danger />
    </div>
  );
}
