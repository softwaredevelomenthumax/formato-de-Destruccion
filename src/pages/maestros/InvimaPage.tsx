import { useState } from "react";
import { Navigate } from "react-router";
import { Package, Search, Plus, Edit2, Trash2 } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { Modal, ConfirmModal } from "../../components/ui/Modal";
import { Badge } from "../../components/ui/Badge";
import { EmptyState } from "../../components/ui/EmptyState";
import type { InvimaProduct } from "../../types";
import { toast } from "sonner";
import { useAuth } from "../../context/AuthContext";
import { EMPRESAS } from "../../constants";

const emptyMaterial = (): Omit<InvimaProduct, "id"> => ({
  codigoMaterial: "", productName: "", clase: "PT", codigo: "", registryNumber: "",
  controlado: false, empresa: "Humax", empresaCode: "CO11", holder: "Humax",
  fabricante: "", estatusSap: "Activo", canal: "", tipoMedicamento: "", presentacion: "",
  internalStatus: "", requiereSap: true, requiereInvima: true, unidadMedidaBase: "",
  precioEstandar: undefined, densidad: undefined, pesoUnidad: undefined,
});

export default function InvimaPage() {
  const { user } = useAuth();
  const { invimaProducts, addInvimaProduct, updateInvimaProduct, deleteInvimaProduct } = useApp();
  const [search, setSearch] = useState("");
  const [empresaFilter, setEmpresaFilter] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<InvimaProduct | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<InvimaProduct, "id">>(emptyMaterial());

  if (user?.rol !== "planeacion") return <Navigate to="/dashboard" replace />;
  const query = search.toLowerCase().trim();
  const filtered = invimaProducts.filter((product) => (
    (!empresaFilter || product.empresa === empresaFilter) &&
    (!query || [product.codigo, product.registryNumber, product.productName, product.centro]
      .some((value) => (value || "").toLowerCase().includes(query)))
  ));
  const updateField = (field: keyof Omit<InvimaProduct, "id">, value: string | number | boolean | undefined) => setForm((previous) => ({ ...previous, [field]: value }));
  const openCreate = () => { setEditItem(null); setForm(emptyMaterial()); setModalOpen(true); };
  const openEdit = (item: InvimaProduct) => { setEditItem(item); setForm({ ...emptyMaterial(), ...item }); setModalOpen(true); };
  const handleSave = () => {
    if (!form.codigo?.trim() || !form.productName.trim()) { toast.error("Material y texto breve son obligatorios"); return; }
    const material = { ...form, codigoMaterial: form.codigoMaterial?.trim() || form.codigo.trim() };
    if (editItem) { updateInvimaProduct(editItem.id, material); toast.success("Material actualizado"); }
    else { addInvimaProduct(material); toast.success("Material creado"); }
    setModalOpen(false);
  };
  const numberField = (field: "precioEstandar" | "densidad" | "pesoUnidad", step: string) => (
    <input type="number" step={step} value={form[field] ?? ""} onChange={(event) => updateField(field, event.target.value === "" ? undefined : Number(event.target.value))} />
  );
  return <div className="space-y-5">
    <div className="flex items-center justify-between"><div><h1 className="text-xl font-bold text-slate-900">Maestro unificado de productos</h1><p className="mt-0.5 text-sm text-slate-500">{filtered.length} registros</p></div><button onClick={openCreate} className="flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800"><Plus size={16} /> Nuevo material</button></div>
    <div className="flex flex-wrap gap-3"><div className="relative min-w-48 flex-1"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por código SAP, INVIMA, nombre o centro..." className="w-full rounded-lg border border-slate-300 py-2 pl-8 pr-4 text-sm" /></div><select value={empresaFilter} onChange={(event) => setEmpresaFilter(event.target.value)} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"><option value="">Todas las empresas</option>{EMPRESAS.map((empresa) => <option key={empresa}>{empresa}</option>)}</select></div>
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">{filtered.length === 0 ? <EmptyState icon={<Package size={48} />} title="No se encontraron materiales" /> : <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b border-slate-200 bg-slate-50">{["Material (código SAP)", "Texto breve de material", "Tipo material", "Unidad medida base", "Centro", "Registro INVIMA", "Controlado/No controlado", "Precio estándar", "PB nivel centro", "Status material todos los centros", "Status material centro", "Planificación de necesidades", "Densidad", "Peso de la un/pza", ""].map((heading) => <Head key={heading}>{heading}</Head>)}</tr></thead><tbody className="divide-y divide-slate-100">{filtered.map((product) => <tr key={product.id} className="hover:bg-slate-50"><td className="cell font-mono text-xs font-semibold text-blue-700">{product.codigo || "—"}</td><td className="cell font-medium text-slate-800">{product.productName || "—"}</td><td className="cell"><Badge label={product.clase || "—"} variant="muted" /></td><td className="cell">{product.unidadMedidaBase || "—"}</td><td className="cell">{product.centro || "—"}<span className="block text-xs text-slate-400">{product.empresaCode || "—"}</span></td><td className="cell font-mono text-xs">{product.registryNumber || "—"}</td><td className="cell"><Badge label={product.controlado ? "Controlado" : "No controlado"} variant={product.controlado ? "error" : "success"} /></td><td className="cell text-right">{product.precioEstandar == null ? "—" : product.precioEstandar.toLocaleString("es-CO")}</td><td className="cell">{product.pbNivelCentro || "—"}</td><td className="cell">{product.statusMaterialTodosCentros || "—"}</td><td className="cell">{product.statusMaterialCentro || "—"}</td><td className="cell">{product.planifNecesidades || "—"}</td><td className="cell text-right">{product.densidad ?? "—"}</td><td className="cell text-right">{product.pesoUnidad ?? "—"}</td><td className="cell"><div className="flex justify-end gap-1"><button onClick={() => openEdit(product)} className="rounded p-1.5 text-slate-400 hover:bg-blue-50 hover:text-blue-600"><Edit2 size={14} /></button><button onClick={() => setDeleteConfirm(product.id)} className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"><Trash2 size={14} /></button></div></td></tr>)}</tbody></table></div>}</div>
    <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editItem ? "Editar material" : "Nuevo material"} size="lg" footer={<><button onClick={() => setModalOpen(false)} className="rounded-lg px-4 py-2 text-sm text-slate-600 hover:bg-slate-100">Cancelar</button><button onClick={handleSave} className="rounded-lg bg-blue-700 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-800">Guardar</button></>}><div className="grid grid-cols-1 gap-4 sm:grid-cols-2"><Field label="Material (código SAP) *"><input value={form.codigo || ""} onChange={(event) => updateField("codigo", event.target.value)} /></Field><Field label="Tipo material *"><input value={form.clase || ""} onChange={(event) => updateField("clase", event.target.value)} /></Field><Field label="Texto breve de material *" wide><input value={form.productName} onChange={(event) => updateField("productName", event.target.value)} /></Field><Field label="Unidad medida base"><input value={form.unidadMedidaBase || ""} onChange={(event) => updateField("unidadMedidaBase", event.target.value)} /></Field><Field label="Registro INVIMA"><input value={form.registryNumber || ""} onChange={(event) => updateField("registryNumber", event.target.value)} /></Field><Field label="Precio estándar">{numberField("precioEstandar", "0.0001")}</Field><Field label="Densidad">{numberField("densidad", "0.000001")}</Field><Field label="Peso de la un/pza">{numberField("pesoUnidad", "0.000001")}</Field><Field label="Controlado/No controlado" wide><select value={form.controlado ? "controlado" : "no_controlado"} onChange={(event) => updateField("controlado", event.target.value === "controlado")}><option value="no_controlado">No controlado</option><option value="controlado">Controlado</option></select></Field></div></Modal>
    <ConfirmModal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} onConfirm={() => { if (deleteConfirm) { deleteInvimaProduct(deleteConfirm); toast.success("Material eliminado"); setDeleteConfirm(null); } }} title="Eliminar material" message="¿Está seguro de eliminar este material?" confirmLabel="Eliminar" danger />
  </div>;
}

function Head({ children }: { children: React.ReactNode }) { return <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">{children}</th>; }
function Field({ label, children, wide = false }: { label: string; children: React.ReactNode; wide?: boolean }) { return <div className={wide ? "sm:col-span-2" : ""}><label className="mb-1 block text-sm font-medium text-slate-700">{label}</label><div className="[&_input]:w-full [&_input]:rounded-lg [&_input]:border [&_input]:border-slate-300 [&_input]:px-3 [&_input]:py-2 [&_select]:w-full [&_select]:rounded-lg [&_select]:border [&_select]:border-slate-300 [&_select]:bg-white [&_select]:px-3 [&_select]:py-2">{children}</div></div>; }
