import { useState, useCallback, type ReactNode } from "react";
import { useNavigate } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Calendar, Package, AlertTriangle, CheckCircle2, Info, Upload, X,
  Trash2, RotateCcw, Zap, ShieldOff, Wrench, HelpCircle
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useApp } from "../../context/AppContext";
import { Stepper, ProgressBar } from "../../components/ui/Stepper";
import { Modal } from "../../components/ui/Modal";
import {
  CLASIFICACION_LABELS, CAUSAL_LABELS, CAUSAL_DESCRIPTIONS, EMPRESAS, AREAS
} from "../../constants";
import type { ClasificacionMaterial, CausalDestruccion, Empresa } from "../../types";
import { CECOS_DATA } from "../../data/cecos";
import { toast } from "sonner";

const STEPS = [
  { label: "Info General" },
  { label: "Material" },
  { label: "Económica" },
  { label: "Causal" },
  { label: "Observaciones" },
  { label: "Resumen" },
];

const CAUSAL_ICONS: Record<CausalDestruccion, ReactNode> = {
  material_vencido: <Calendar size={24} />,
  producto_no_conforme: <AlertTriangle size={24} />,
  residuos_proceso: <Trash2 size={24} />,
  contaminacion: <ShieldOff size={24} />,
  dano_operativo: <Wrench size={24} />,
  remanentes: <Package size={24} />,
  producto_retirado: <RotateCcw size={24} />,
  otras: <HelpCircle size={24} />,
};

const step1Schema = z.object({
  empresa: z.enum(["Humax", "Farmatech", "Cambridge"]),
  centroCostos: z.string().min(1, "Seleccione un centro de costos"),
  fecha: z.string().min(1, "La fecha es obligatoria"),
  responsable: z.string().min(1, "El responsable es obligatorio"),
  area: z.string().min(1, "El área es obligatoria"),
});
const step2Schema = z.object({
  descripcion: z.string().min(3, "Descripción obligatoria"),
  codigoSAP: z.string().min(1, "Código SAP obligatorio"),
  numeroLote: z.string().min(1, "Número de lote obligatorio"),
  ordenProduccion: z.string().min(1, "Orden de producción obligatoria"),
  sustanciaControlada: z.boolean(),
  clasificacion: z.enum(["materia_prima", "producto_semiterminado", "granel", "producto_terminado", "material_empaque", "reactivos", "remanentes", "muestras", "otro"] as const),
  fechaVencimiento: z.string().min(1, "Fecha de vencimiento obligatoria"),
  registroINVIMA: z.string().min(1, "Registro INVIMA obligatorio"),
  otraClasificacion: z.string().optional(),
});
const step3Schema = z.object({
  pesoKg: z.number().positive("El peso debe ser mayor a 0"),
  cantidadUnidades: z.number().int().positive("La cantidad debe ser mayor a 0"),
  costoDestruccion: z.number().positive("El costo debe ser mayor a 0"),
});

type Step1Data = z.infer<typeof step1Schema>;
type Step2Data = z.infer<typeof step2Schema>;
type Step3Data = z.infer<typeof step3Schema>;

export default function ActaCreatePage() {
  const { user } = useAuth();
  const { createActa, sendActa, invimaProducts } = useApp();
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [formData, setFormData] = useState<Partial<Step1Data & Step2Data & Step3Data>>({});
  const [selectedCausal, setSelectedCausal] = useState<CausalDestruccion | null>(null);
  const [pendingCausal, setPendingCausal] = useState<CausalDestruccion | null>(null);
  const [otraCausal, setOtraCausal] = useState("");
  const [observaciones, setObservaciones] = useState("");
  const [adjuntos, setAdjuntos] = useState<string[]>([]);
  const [showCausalModal, setShowCausalModal] = useState(false);
  const [selectedEmpresa, setSelectedEmpresa] = useState<Empresa>("Humax");
  const [invimaSearch, setInvimaSearch] = useState("");
  const [showInvimaDropdown, setShowInvimaDropdown] = useState(false);

  const form1 = useForm<Step1Data>({ resolver: zodResolver(step1Schema), defaultValues: { fecha: new Date().toISOString().split("T")[0], empresa: "Humax" } });
  const form2 = useForm<Step2Data>({ resolver: zodResolver(step2Schema), defaultValues: { sustanciaControlada: false, clasificacion: "producto_terminado" } });
  const form3 = useForm<Step3Data>({
    resolver: zodResolver(step3Schema),
    defaultValues: { pesoKg: 0, cantidadUnidades: 0, costoDestruccion: 0 },
  });

  const empresaWatch = form1.watch("empresa");
  const cecosByEmpresa = CECOS_DATA.filter((c) => c.empresa === empresaWatch);

  const filteredInvima = invimaProducts.filter((p) =>
    p.internalStatus === "Vigente" &&
    (p.productName.toLowerCase().includes(invimaSearch.toLowerCase()) ||
     p.registryNumber.toLowerCase().includes(invimaSearch.toLowerCase()))
  );

  const selectInvima = (product: typeof invimaProducts[0]) => {
    form2.setValue("registroINVIMA", product.registryNumber);
    form2.setValue("descripcion", `${product.productName}${product.presentacion ? " - " + product.presentacion : ""}`);
    form2.setValue("sustanciaControlada", product.controlado);
    setInvimaSearch(product.registryNumber);
    setShowInvimaDropdown(false);
  };

  const onStep1 = form1.handleSubmit((data) => {
    setFormData((prev) => ({ ...prev, ...data }));
    setSelectedEmpresa(data.empresa);
    setCompletedSteps((prev) => [...new Set([...prev, 0])]);
    setCurrentStep(1);
  });

  const onStep2 = form2.handleSubmit((data) => {
    setFormData((prev) => ({ ...prev, ...data }));
    setCompletedSteps((prev) => [...new Set([...prev, 1])]);
    setCurrentStep(2);
  });

  const onStep3 = form3.handleSubmit((data) => {
    setFormData((prev) => ({ ...prev, ...data }));
    setCompletedSteps((prev) => [...new Set([...prev, 2])]);
    setCurrentStep(3);
  });

  const onCausalConfirm = () => {
    if (!pendingCausal) return;
    if (pendingCausal === "otras" && !otraCausal.trim()) {
      toast.error("Debe especificar la otra causal");
      return;
    }
    setSelectedCausal(pendingCausal);
    setCompletedSteps((prev) => [...new Set([...prev, 3])]);
    setShowCausalModal(false);
    setCurrentStep(4);
  };

  const handleSaveDraft = () => {
    if (!user || !selectedCausal) return;
    const data = { ...formData } as any;
    const acta = createActa({
      status: "borrador",
      empresa: data.empresa || "Humax",
      centroCostos: data.centroCostos || "",
      fecha: data.fecha || "",
      solicitanteId: user.id,
      solicitanteNombre: user.nombre,
      responsable: data.responsable || "",
      area: data.area || "",
      descripcion: data.descripcion || "",
      codigoSAP: data.codigoSAP || "",
      numeroLote: data.numeroLote || "",
      ordenProduccion: data.ordenProduccion || "",
      sustanciaControlada: !!data.sustanciaControlada,
      clasificacion: data.clasificacion || "otro",
      fechaVencimiento: data.fechaVencimiento || "",
      registroINVIMA: data.registroINVIMA || "",
      pesoKg: data.pesoKg || 0,
      cantidadUnidades: data.cantidadUnidades || 0,
      costoDestruccion: data.costoDestruccion || 0,
      causal: selectedCausal,
      otraCausal: otraCausal || undefined,
      observaciones,
      adjuntos,
    });
    toast.success(`Borrador guardado: ${acta.consecutivo}`);
    navigate("/actas");
  };

  const handleSendApproval = () => {
    if (!user || !selectedCausal) return;
    const data = { ...formData } as any;
    const acta = createActa({
      status: "enviada",
      empresa: data.empresa || "Humax",
      centroCostos: data.centroCostos || "",
      fecha: data.fecha || "",
      solicitanteId: user.id,
      solicitanteNombre: user.nombre,
      responsable: data.responsable || "",
      area: data.area || "",
      descripcion: data.descripcion || "",
      codigoSAP: data.codigoSAP || "",
      numeroLote: data.numeroLote || "",
      ordenProduccion: data.ordenProduccion || "",
      sustanciaControlada: !!data.sustanciaControlada,
      clasificacion: data.clasificacion || "otro",
      fechaVencimiento: data.fechaVencimiento || "",
      registroINVIMA: data.registroINVIMA || "",
      pesoKg: data.pesoKg || 0,
      cantidadUnidades: data.cantidadUnidades || 0,
      costoDestruccion: data.costoDestruccion || 0,
      causal: selectedCausal,
      otraCausal: otraCausal || undefined,
      observaciones,
      adjuntos,
    });
    sendActa(acta.id, user.id, user.nombre);
    toast.success(`Acta ${acta.consecutivo} enviada a aprobación`);
    navigate(`/actas/${acta.id}`);
  };

  const filled = [
    !!formData.empresa,
    !!formData.descripcion,
    !!formData.pesoKg,
    !!selectedCausal,
    true,
  ];
  const progress = filled.filter(Boolean).length;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Nueva Acta de Destrucción</h1>
          <p className="text-sm text-slate-500 mt-0.5">Complete todos los pasos para crear el acta</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <ProgressBar value={progress} max={5} label="Progreso del formulario" />
        <div className="mt-5">
          <Stepper steps={STEPS} currentStep={currentStep} completedSteps={completedSteps} />
        </div>
      </div>

      {/* Step 1: General Info */}
      {currentStep === 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-base font-semibold text-slate-800 mb-5">Paso 1 — Información General</h2>
          <form onSubmit={onStep1} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Empresa *</label>
                <select {...form1.register("empresa")} className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                  {EMPRESAS.map((e) => <option key={e} value={e}>{e}</option>)}
                </select>
                {form1.formState.errors.empresa && <p className="text-red-500 text-xs mt-1">{form1.formState.errors.empresa.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Centro de Costos *</label>
                <select {...form1.register("centroCostos")} className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                  <option value="">Seleccione un CeCo</option>
                  {cecosByEmpresa.map((c) => (
                    <option key={`${c.empresaCode}-${c.ceco}`} value={`${c.ceco} - ${c.denominacion}`}>
                      {c.ceco} — {c.denominacion}
                    </option>
                  ))}
                </select>
                {form1.formState.errors.centroCostos && <p className="text-red-500 text-xs mt-1">{form1.formState.errors.centroCostos.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Fecha de solicitud *</label>
                <input {...form1.register("fecha")} type="date" className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                {form1.formState.errors.fecha && <p className="text-red-500 text-xs mt-1">{form1.formState.errors.fecha.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Solicitante</label>
                <input type="text" value={user?.nombre || ""} disabled className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg bg-slate-50 text-slate-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Responsable *</label>
                <input {...form1.register("responsable")} placeholder="Nombre del responsable" className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                {form1.formState.errors.responsable && <p className="text-red-500 text-xs mt-1">{form1.formState.errors.responsable.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Área *</label>
                <select {...form1.register("area")} className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                  <option value="">Seleccione un área</option>
                  {AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
                </select>
                {form1.formState.errors.area && <p className="text-red-500 text-xs mt-1">{form1.formState.errors.area.message}</p>}
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <button type="submit" className="bg-blue-700 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-800 transition-colors">
                Siguiente →
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Step 2: Material Info */}
      {currentStep === 1 && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-base font-semibold text-slate-800 mb-5">Paso 2 — Información del Material</h2>
          <form onSubmit={onStep2} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Registro INVIMA *</label>
              <div className="relative">
                <input
                  value={invimaSearch}
                  onChange={(e) => { setInvimaSearch(e.target.value); form2.setValue("registroINVIMA", e.target.value); setShowInvimaDropdown(true); }}
                  onBlur={() => setTimeout(() => setShowInvimaDropdown(false), 200)}
                  placeholder="Buscar por nombre o número de registro..."
                  className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {showInvimaDropdown && filteredInvima.length > 0 && (
                  <div className="absolute top-full mt-1 left-0 right-0 bg-white border border-slate-200 rounded-lg shadow-lg z-20 max-h-48 overflow-y-auto">
                    {filteredInvima.map((p) => (
                      <button key={p.id} type="button" onMouseDown={() => selectInvima(p)}
                        className="w-full text-left px-4 py-2.5 hover:bg-blue-50 transition-colors border-b border-slate-100 last:border-0">
                        <p className="text-sm font-medium text-slate-800">{p.productName}</p>
                        <p className="text-xs text-slate-500">{p.registryNumber} · {p.holder} · {p.presentacion}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {form2.formState.errors.registroINVIMA && <p className="text-red-500 text-xs mt-1">{form2.formState.errors.registroINVIMA.message}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Descripción del material *</label>
                <input {...form2.register("descripcion")} placeholder="Nombre, concentración y presentación" className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                {form2.formState.errors.descripcion && <p className="text-red-500 text-xs mt-1">{form2.formState.errors.descripcion.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Código SAP *</label>
                <input {...form2.register("codigoSAP")} placeholder="SAP-XXXXX" className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                {form2.formState.errors.codigoSAP && <p className="text-red-500 text-xs mt-1">{form2.formState.errors.codigoSAP.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Número de Lote *</label>
                <input {...form2.register("numeroLote")} placeholder="LOT-XXXX o NO APLICA" className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                {form2.formState.errors.numeroLote && <p className="text-red-500 text-xs mt-1">{form2.formState.errors.numeroLote.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Orden de Producción *</label>
                <input {...form2.register("ordenProduccion")} placeholder="OP-XXXX o NO APLICA" className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                {form2.formState.errors.ordenProduccion && <p className="text-red-500 text-xs mt-1">{form2.formState.errors.ordenProduccion.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Fecha de Vencimiento *</label>
                <input {...form2.register("fechaVencimiento")} type="date" className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                {form2.formState.errors.fechaVencimiento && <p className="text-red-500 text-xs mt-1">{form2.formState.errors.fechaVencimiento.message}</p>}
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">Clasificación *</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {Object.entries(CLASIFICACION_LABELS).map(([val, lbl]) => (
                    <label key={val} className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm cursor-pointer transition-all ${form2.watch("clasificacion") === val ? "border-blue-500 bg-blue-50 text-blue-700" : "border-slate-200 hover:border-slate-300"}`}>
                      <input {...form2.register("clasificacion")} type="radio" value={val} className="sr-only" />
                      {lbl}
                    </label>
                  ))}
                </div>
              </div>
              <div className="sm:col-span-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input {...form2.register("sustanciaControlada")} type="checkbox" className="w-4 h-4 text-blue-600 rounded border-slate-300" />
                  <span className="text-sm font-medium text-slate-700">¿Es sustancia controlada?</span>
                </label>
              </div>
            </div>
            <div className="flex justify-between pt-2">
              <button type="button" onClick={() => setCurrentStep(0)} className="px-4 py-2.5 text-sm text-slate-600 hover:text-slate-900 font-medium">← Anterior</button>
              <button type="submit" className="bg-blue-700 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-800 transition-colors">Siguiente →</button>
            </div>
          </form>
        </div>
      )}

      {/* Step 3: Economic Info */}
      {currentStep === 2 && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-base font-semibold text-slate-800 mb-5">Paso 3 — Información Económica</h2>
          <form onSubmit={onStep3} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Peso (kg) *</label>
                <input {...form3.register("pesoKg", { valueAsNumber: true })} type="number" step="0.001" min="0" placeholder="0.000" className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                {form3.formState.errors.pesoKg && <p className="text-red-500 text-xs mt-1">{form3.formState.errors.pesoKg.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Cantidad (unidades) *</label>
                <input {...form3.register("cantidadUnidades", { valueAsNumber: true })} type="number" min="1" placeholder="0" className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                {form3.formState.errors.cantidadUnidades && <p className="text-red-500 text-xs mt-1">{form3.formState.errors.cantidadUnidades.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Costo destrucción (COP) *</label>
                <input {...form3.register("costoDestruccion", { valueAsNumber: true })} type="number" min="0" placeholder="0" className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                {form3.formState.errors.costoDestruccion && <p className="text-red-500 text-xs mt-1">{form3.formState.errors.costoDestruccion.message}</p>}
              </div>
            </div>
            <div className="flex justify-between pt-2">
              <button type="button" onClick={() => setCurrentStep(1)} className="px-4 py-2.5 text-sm text-slate-600 hover:text-slate-900 font-medium">← Anterior</button>
              <button type="submit" className="bg-blue-700 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-800 transition-colors">Siguiente →</button>
            </div>
          </form>
        </div>
      )}

      {/* Step 4: Causal */}
      {currentStep === 3 && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-base font-semibold text-slate-800 mb-2">Paso 4 — Causal de Destrucción</h2>
          <p className="text-sm text-slate-500 mb-5">Seleccione la causal que mejor describe el motivo de destrucción</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {(Object.keys(CAUSAL_LABELS) as CausalDestruccion[]).map((causal) => (
              <button
                key={causal}
                onClick={() => { setPendingCausal(causal); setShowCausalModal(true); }}
                className={`flex flex-col items-center text-center gap-2 p-4 rounded-xl border-2 transition-all hover:shadow-md ${selectedCausal === causal ? "border-blue-600 bg-blue-50" : "border-slate-200 hover:border-blue-300 bg-white"}`}
              >
                <div className={`${selectedCausal === causal ? "text-blue-700" : "text-slate-500"}`}>
                  {CAUSAL_ICONS[causal]}
                </div>
                <p className={`text-xs font-semibold leading-tight ${selectedCausal === causal ? "text-blue-700" : "text-slate-700"}`}>
                  {CAUSAL_LABELS[causal]}
                </p>
              </button>
            ))}
          </div>
          {selectedCausal === "otras" && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-slate-700 mb-1">Especifique la causal *</label>
              <textarea
                value={otraCausal}
                onChange={(e) => setOtraCausal(e.target.value)}
                placeholder="Describa detalladamente la causal de destrucción..."
                rows={3}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
          {!selectedCausal && (
            <p className="text-sm text-amber-600 mt-3 flex items-center gap-1.5">
              <AlertTriangle size={14} /> Debe seleccionar una causal para continuar
            </p>
          )}
          <div className="flex justify-between pt-4">
            <button onClick={() => setCurrentStep(2)} className="px-4 py-2.5 text-sm text-slate-600 hover:text-slate-900 font-medium">← Anterior</button>
            <button
              onClick={() => { if (selectedCausal) { setCompletedSteps((p) => [...new Set([...p, 3])]); setCurrentStep(4); } else toast.error("Seleccione una causal"); }}
              disabled={!selectedCausal}
              className="bg-blue-700 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-800 transition-colors disabled:opacity-50"
            >
              Siguiente →
            </button>
          </div>
        </div>
      )}

      {/* Step 5: Observations */}
      {currentStep === 4 && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-base font-semibold text-slate-800 mb-5">Paso 5 — Observaciones y Adjuntos</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Observaciones</label>
              <textarea
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                placeholder="Información adicional relevante para la destrucción..."
                rows={4}
                className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Documentos soporte</label>
              <div
                className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:border-blue-400 hover:bg-blue-50 transition-all cursor-pointer"
                onClick={() => {
                  const name = prompt("Nombre del archivo (simulado):");
                  if (name) setAdjuntos((prev) => [...prev, name]);
                }}
              >
                <Upload size={28} className="mx-auto text-slate-400 mb-2" />
                <p className="text-sm text-slate-600 font-medium">Haga clic para adjuntar documentos</p>
                <p className="text-xs text-slate-400 mt-1">PDF, Word, Excel — Máx. 10 MB por archivo</p>
              </div>
              {adjuntos.length > 0 && (
                <div className="mt-3 space-y-2">
                  {adjuntos.map((adj, i) => (
                    <div key={i} className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2 border border-slate-200">
                      <Package size={14} className="text-slate-400 shrink-0" />
                      <span className="text-sm text-slate-700 flex-1">{adj}</span>
                      <button onClick={() => setAdjuntos((prev) => prev.filter((_, j) => j !== i))} className="text-slate-400 hover:text-red-500">
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="flex justify-between pt-4">
            <button onClick={() => setCurrentStep(3)} className="px-4 py-2.5 text-sm text-slate-600 hover:text-slate-900 font-medium">← Anterior</button>
            <button
              onClick={() => { setCompletedSteps((p) => [...new Set([...p, 4])]); setCurrentStep(5); }}
              className="bg-blue-700 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-800 transition-colors"
            >
              Ver Resumen →
            </button>
          </div>
        </div>
      )}

      {/* Step 6: Summary */}
      {currentStep === 5 && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-base font-semibold text-slate-800 mb-5">Paso 6 — Resumen del Acta</h2>
          <div className="space-y-4">
            <Section title="Información General">
              <Row label="Empresa" value={String(formData.empresa || "")} />
              <Row label="Centro de Costos" value={String(formData.centroCostos || "")} />
              <Row label="Fecha" value={String(formData.fecha || "")} />
              <Row label="Solicitante" value={user?.nombre || ""} />
              <Row label="Responsable" value={String(formData.responsable || "")} />
              <Row label="Área" value={String(formData.area || "")} />
            </Section>
            <Section title="Información del Material">
              <Row label="Descripción" value={String(formData.descripcion || "")} />
              <Row label="Código SAP" value={String(formData.codigoSAP || "")} />
              <Row label="Número de Lote" value={String(formData.numeroLote || "")} />
              <Row label="Orden de Producción" value={String(formData.ordenProduccion || "")} />
              <Row label="Clasificación" value={CLASIFICACION_LABELS[formData.clasificacion || "otro"]} />
              <Row label="Fecha Vencimiento" value={String(formData.fechaVencimiento || "")} />
              <Row label="Registro INVIMA" value={String(formData.registroINVIMA || "")} />
              <Row label="Sustancia Controlada" value={formData.sustanciaControlada ? "Sí" : "No"} />
            </Section>
            <Section title="Información Económica">
              <Row label="Peso (kg)" value={String(formData.pesoKg || 0)} />
              <Row label="Unidades" value={String(formData.cantidadUnidades || 0)} />
              <Row label="Costo Destrucción" value={`COP ${Number(formData.costoDestruccion || 0).toLocaleString("es-CO")}`} />
            </Section>
            <Section title="Causal">
              <Row label="Causal" value={selectedCausal ? CAUSAL_LABELS[selectedCausal] : ""} />
              {selectedCausal === "otras" && otraCausal && <Row label="Especificación" value={otraCausal} />}
            </Section>
            {observaciones && (
              <Section title="Observaciones">
                <p className="text-sm text-slate-700">{observaciones}</p>
              </Section>
            )}
            {adjuntos.length > 0 && (
              <Section title="Adjuntos">
                <ul className="text-sm text-slate-700 space-y-1">
                  {adjuntos.map((a, i) => <li key={i} className="flex items-center gap-1.5"><Package size={12} className="text-slate-400" />{a}</li>)}
                </ul>
              </Section>
            )}
          </div>

          <div className="flex justify-between pt-5 border-t border-slate-200 mt-5">
            <button onClick={() => setCurrentStep(4)} className="px-4 py-2.5 text-sm text-slate-600 hover:text-slate-900 font-medium">← Anterior</button>
            <div className="flex gap-3">
              <button onClick={handleSaveDraft} className="px-5 py-2.5 text-sm font-medium border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors">
                Guardar Borrador
              </button>
              <button onClick={handleSendApproval} className="bg-blue-700 text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-800 transition-colors flex items-center gap-2">
                <CheckCircle2 size={16} /> Enviar a Aprobación
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Causal confirmation modal */}
      <Modal
        open={showCausalModal}
        onClose={() => setShowCausalModal(false)}
        title={pendingCausal ? CAUSAL_LABELS[pendingCausal] : ""}
        size="md"
        footer={
          <>
            <button onClick={() => setShowCausalModal(false)} className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900 font-medium rounded-lg hover:bg-slate-100 transition-colors">
              Cancelar
            </button>
            <button onClick={onCausalConfirm} className="px-5 py-2 text-sm font-semibold bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition-colors">
              Confirmar Causal
            </button>
          </>
        }
      >
        {pendingCausal && (
          <div className="space-y-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-sm text-slate-700">{CAUSAL_DESCRIPTIONS[pendingCausal].description}</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-700">¿Cuándo aplica?</p>
              <p className="text-sm text-slate-600 mt-1">{CAUSAL_DESCRIPTIONS[pendingCausal].cuando}</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-700">Ejemplos:</p>
              <ul className="mt-1 space-y-1">
                {CAUSAL_DESCRIPTIONS[pendingCausal].ejemplos.map((e, i) => (
                  <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                    <span className="text-blue-500 mt-0.5">•</span>{e}
                  </li>
                ))}
              </ul>
            </div>
            {pendingCausal === "otras" && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Especifique la causal *</label>
                <textarea
                  value={otraCausal}
                  onChange={(e) => setOtraCausal(e.target.value)}
                  placeholder="Describa el motivo de destrucción..."
                  rows={3}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}
            <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3">
              <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800 font-medium">¿Está seguro de que esta es la causal correcta?</p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden">
      <div className="bg-slate-50 px-4 py-2 border-b border-slate-200">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{title}</p>
      </div>
      <div className="px-4 py-3 divide-y divide-slate-100">{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-4 py-1.5">
      <p className="text-xs text-slate-500 font-medium w-36 shrink-0">{label}</p>
      <p className="text-sm text-slate-800 flex-1">{value || "—"}</p>
    </div>
  );
}
