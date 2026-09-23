import { useEffect, useState, type ReactNode } from "react";
import { Navigate } from "react-router";
import { Package, Search, Plus, Edit2, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
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

const isControlledType = (value: unknown) => ["PT", "FERT"].includes(String(value || "").trim().toUpperCase());
const PAGE_SIZE = 30;

export default function InvimaPage() {
  const { user } = useAuth();
  const { invimaProducts, addInvimaProduct, updateInvimaProduct, deleteInvimaProduct } = useApp();
  const [search, setSearch] = useState("");
  const [empresaFilter, setEmpresaFilter] = useState("");
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [action, setAction] = useState<"edit" | "delete" | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<InvimaProduct, "id">>(emptyMaterial());

  const query = search.toLowerCase().trim();
  const filtered = invimaProducts.filter((product) => (
    (!empresaFilter || product.empresa === empresaFilter) &&
    (!query || [product.codigo, product.codigoMaterial, product.registryNumber, product.productName, product.centro]
      .some((value) => (value || "").toLowerCase().includes(query)))
  ));
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const selectedItem = invimaProducts.find((product) => product.id === selectedId) || null;

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
    if (selectedId && !invimaProducts.some((product) => product.id === selectedId)) setSelectedId(null);
  }, [page, selectedId, invimaProducts, totalPages]);

  if (user?.rol !== "planeacion") return <Navigate to="/dashboard" replace />;

  const updateField = (field: keyof Omit<InvimaProduct, "id">, value: string | number | boolean | undefined) => {
    setForm((previous) => ({ ...previous, [field]: value }));
  };
  const openCreate = () => { setAction("edit"); setSelectedId(null); setForm(emptyMaterial()); setModalOpen(true); };
  const openEdit = () => { if (selectedItem) { setAction("edit"); setForm({ ...emptyMaterial(), ...selectedItem }); setModalOpen(true); } };
  const openDelete = () => { if (selectedItem) setAction("delete"); };
  const closeModal = () => { setModalOpen(false); setAction(null); };

  const handleSave = () => {
    if (!form.codigo?.trim() || !form.productName.trim()) { toast.error("Material y texto breve son obligatorios"); return; }
    const material = { ...form, codigoMaterial: form.codigoMaterial?.trim() || form.codigo.trim(), controlado: isControlledType(form.clase) || form.controlado };
    if (selectedItem) { updateInvimaProduct(selectedItem.id, material); toast.success("Material actualizado"); }
    else { addInvimaProduct(material); toast.success("Material creado"); }
    closeModal();
  };
  const handleDelete = () => {
    if (!selectedItem) return;
    deleteInvimaProduct(selectedItem.id);
    toast.success("Material eliminado");
    setSelectedId(null);
    setAction(null);
  };

  return <div className="space-y-5">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div><h1 className="text-xl font-bold text-slate-900">Maestro de Planeación</h1><p className="mt-0.5 text-sm text-slate-500">{filtered.length} registros</p></div>
      <div className="flex flex-wrap gap-2">
        <button onClick={openEdit} disabled={!selectedItem} className="flex items-center gap-2 rounded-lg border border-blue-200 px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-40"><Edit2 size={16} /> Editar</button>
        <button onClick={openDelete} disabled={!selectedItem} className="flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"><Trash2 size={16} /> Eliminar</button>
        <button onClick={openCreate} className="flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800"><Plus size={16} /> Nuevo material</button>
      </div>
    </div>
    <div className="flex flex-wrap gap-3"><div className="relative min-w-48 flex-1"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Buscar por código SAP, INVIMA, nombre o centro..." className="w-full rounded-lg border border-slate-300 py-2 pl-8 pr-4 text-sm" /></div><select value={empresaFilter} onChange={(event) => { setEmpresaFilter(event.target.value); setPage(1); }} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"><option value="">Todas las empresas</option>{EMPRESAS.map((empresa) => <option key={empresa}>{empresa}</option>)}</select></div>
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">{pageItems.length === 0 ? <EmptyState icon={<Package size={48} />} title="No se encontraron materiales" /> : <div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b border-slate-200 bg-slate-50"><Head>Sel.</Head>{["Material (código SAP)", "Texto breve de material", "Tipo material", "Unidad medida base", "Centro", "Registro INVIMA", "Controlado/No controlado", "Precio estándar", "PB nivel centro", "Status material todos los centros", "Status material centro", "Planificación de necesidades", "Densidad", "Peso de la un/pza"].map((heading) => <Head key={heading}>{heading}</Head>)}</tr></thead><tbody className="divide-y divide-slate-100">{pageItems.map((product) => <tr key={product.id} className={`hover:bg-slate-50 ${selectedId === product.id ? "bg-blue-50" : ""}`}><td className="cell"><input type="radio" name="selected-material" checked={selectedId === product.id} onChange={() => setSelectedId(product.id)} aria-label={`Seleccionar ${product.codigo || product.productName}`} /></td><td className="cell font-mono text-xs font-semibold text-blue-700">{product.codigo || "—"}</td><td className="cell font-medium text-slate-800">{product.productName || "—"}</td><td className="cell"><Badge label={product.clase || "—"} variant="muted" /></td><td className="cell">{product.unidadMedidaBase || "—"}</td><td className="cell">{product.centro || "—"}<span className="block text-xs text-slate-400">{product.empresaCode || "—"}</span></td><td className="cell font-mono text-xs">{product.registryNumber || "—"}</td><td className="cell"><Badge label={product.controlado ? "Controlado" : "No controlado"} variant={product.controlado ? "error" : "success"} /></td><td className="cell text-right">{product.precioEstandar == null ? "—" : product.precioEstandar.toLocaleString("es-CO")}</td><td className="cell">{product.pbNivelCentro || "—"}</td><td className="cell">{product.statusMaterialTodosCentros || "—"}</td><td className="cell">{product.statusMaterialCentro || "—"}</td><td className="cell">{product.planifNecesidades || "—"}</td><td className="cell text-right">{product.densidad ?? "—"}</td><td className="cell text-right">{product.pesoUnidad ?? "—"}</td></tr>)}</tbody></table></div>}
      {filtered.length > 0 && <div className="flex items-center justify-between gap-4 border-t border-slate-200 px-4 py-3"><p className="text-xs text-slate-500">Página {page} de {totalPages} · Mostrando {((page - 1) * PAGE_SIZE) + 1}-{Math.min(page * PAGE_SIZE, filtered.length)} de {filtered.length}</p><div className="flex gap-2"><button type="button" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page === 1} aria-label="Página anterior" className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40"><ChevronLeft size={16} /></button><button type="button" onClick={() => setPage((current) => Math.min(totalPages, current + 1))} disabled={page === totalPages} aria-label="Página siguiente" className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40"><ChevronRight size={16} /></button></div></div>}
    </div>
    <Modal open={modalOpen} onClose={closeModal} title={selectedItem ? "Editar material" : "Nuevo material"} size="xl" footer={<><button onClick={closeModal} className="rounded-lg px-4 py-2 text-sm text-slate-600 hover:bg-slate-100">Cancelar</button><button onClick={handleSave} className="rounded-lg bg-blue-700 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-800">Guardar</button></>}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{FORM_FIELDS.map((field) => <Field key={field.key} label={field.label}><input value={(form[field.key] as string | number | undefined) ?? ""} type={field.numeric ? "number" : "text"} onChange={(event) => updateField(field.key, field.numeric ? (event.target.value === "" ? undefined : Number(event.target.value)) : event.target.value)} /></Field>)}<Field label="Controlado/No controlado" wide><select value={form.controlado ? "controlado" : "no_controlado"} onChange={(event) => updateField("controlado", event.target.value === "controlado")}><option value="no_controlado">No controlado</option><option value="controlado">Controlado</option></select></Field><Field label="Requiere SAP"><select value={form.requiereSap ? "si" : "no"} onChange={(event) => updateField("requiereSap", event.target.value === "si")}><option value="si">Sí</option><option value="no">No</option></select></Field><Field label="Requiere INVIMA"><select value={form.requiereInvima ? "si" : "no"} onChange={(event) => updateField("requiereInvima", event.target.value === "si")}><option value="si">Sí</option><option value="no">No</option></select></Field></div>
    </Modal>
    <ConfirmModal open={action === "delete" && !!selectedItem} onClose={() => setAction(null)} onConfirm={handleDelete} title="Eliminar material" message={selectedItem ? <div className="space-y-2"><p>¿Está seguro de que desea eliminar este material?</p><p className="rounded-lg bg-slate-50 p-3 font-medium text-slate-800"><strong>{selectedItem.codigo || "Sin código"}</strong> · {selectedItem.productName || "Sin descripción"}</p></div> : ""} confirmLabel="Eliminar" danger />
  </div>;
}

const FORM_FIELDS: { key: keyof Omit<InvimaProduct, "id">; label: string; numeric?: boolean }[] = [
  { key: "codigo", label: "Material (código SAP) *" }, { key: "codigoMaterial", label: "Código de material" }, { key: "productName", label: "Texto breve de material *" }, { key: "clase", label: "Tipo material" }, { key: "unidadMedidaBase", label: "Unidad medida base" }, { key: "centro", label: "Centro" }, { key: "empresaCode", label: "Código empresa" }, { key: "empresa", label: "Empresa" }, { key: "registryNumber", label: "Registro INVIMA" }, { key: "fabricante", label: "Fabricante" }, { key: "holder", label: "Titular" }, { key: "canal", label: "Canal" }, { key: "tipoMedicamento", label: "Tipo de medicamento" }, { key: "presentacion", label: "Presentación" }, { key: "estatusSap", label: "Estatus SAP" }, { key: "internalStatus", label: "Estado interno" }, { key: "pbNivelCentro", label: "PB nivel centro" }, { key: "statusMaterialTodosCentros", label: "Status material todos los centros" }, { key: "statusMaterialCentro", label: "Status material centro" }, { key: "planifNecesidades", label: "Planificación de necesidades" }, { key: "precioEstandar", label: "Precio estándar", numeric: true }, { key: "densidad", label: "Densidad", numeric: true }, { key: "pesoUnidad", label: "Peso de la un/pza", numeric: true },
];
function Head({ children }: { children: ReactNode }) { return <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">{children}</th>; }
function Field({ label, children, wide = false }: { label: string; children: ReactNode; wide?: boolean }) { return <div className={wide ? "sm:col-span-2" : ""}><label className="mb-1 block text-sm font-medium text-slate-700">{label}</label><div className="[&_input]:w-full [&_input]:rounded-lg [&_input]:border [&_input]:border-slate-300 [&_input]:px-3 [&_input]:py-2 [&_select]:w-full [&_select]:rounded-lg [&_select]:border [&_select]:border-slate-300 [&_select]:bg-white [&_select]:px-3 [&_select]:py-2">{children}</div></div>; }
