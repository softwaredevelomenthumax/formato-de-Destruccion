import { useState, useCallback, useEffect, useRef, type ReactNode } from "react";
import { useNavigate, useParams } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Calendar, Package, AlertTriangle, CheckCircle2, Info, Upload, X,
  Trash2, RotateCcw, Zap, ShieldOff, Wrench, HelpCircle, Search
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useApp } from "../../context/AppContext";
import { Stepper, ProgressBar } from "../../components/ui/Stepper";
import { Modal } from "../../components/ui/Modal";
import {
  CLASIFICACION_LABELS, CAUSAL_LABELS, CAUSAL_DESCRIPTIONS, EMPRESAS, AREAS
} from "../../constants";
import type { CausalDestruccion, Ceco, Empresa } from "../../types";
import { api } from "../../services/api.ts";
import { toast } from "sonner";

const ACTA_DRAFT_STORAGE_KEY = "humax-acta-draft";

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

const requiredString = (field: string) =>
  z.any().refine((value) => typeof value === "string" && value.trim().length > 0, {
    message: `${field} es obligatorio`,
  });

const dateStringSchema = z
  .any()
  .refine((value) => typeof value === "string" && value.trim().length > 0, {
    message: "La fecha es obligatoria",
  })
  .refine((value) => typeof value !== "string" || /^\d{4}-\d{2}-\d{2}$/.test(value), {
    message: "La fecha debe tener el formato DD/MM/YYYY",
  });

const clampDatePart = (value: string, max: number) => {
  if (!value) return "";
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return "";
  return String(Math.min(Math.max(numeric, 1), max)).padStart(2, "0");
};

const formatDateDisplay = (value?: string) => {
  if (!value) return "";

  if (value.includes("-")) {
    const [year, month, day] = value.split("-");
    if (year && month && day) return `${day}/${month}/${year}`;
  }

  const raw = value.replace(/\D/g, "").slice(0, 8);
  if (!raw) return "";
  if (raw.length <= 2) return raw;
  if (raw.length <= 4) return `${raw.slice(0, 2)}/${raw.slice(2)}`;
  if (raw.length <= 6) return `${raw.slice(0, 2)}/${raw.slice(2, 4)}/${raw.slice(4)}`;
  return `${raw.slice(0, 2)}/${raw.slice(2, 4)}/${raw.slice(4, 8)}`;
};

const toIsoDate = (value?: string) => {
  const raw = (value || "").replace(/\D/g, "").slice(0, 8);
  if (raw.length !== 8) return raw;

  const day = clampDatePart(raw.slice(0, 2), 31);
  const month = clampDatePart(raw.slice(2, 4), 12);
  const year = raw.slice(4, 8);

  return `${year}-${month}-${day}`;
};

function DateField({
  value,
  onChange,
  placeholder = "DD/MM/YYYY",
  disabled = false,
}: {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  const nativeInputRef = useRef<HTMLInputElement | null>(null);
  const displayValue = formatDateDisplay(value || "");

  const handleInput = (raw: string) => {
    const digits = raw.replace(/\D/g, "").slice(0, 8);
    if (!digits) {
      onChange("");
      return;
    }

    const day = digits.slice(0, 2);
    const month = digits.slice(2, 4);
    const year = digits.slice(4, 8);

    const normalized = digits.length === 8
      ? toIsoDate(`${day}${month}${year}`)
      : `${day}${month ? `/${month}` : ""}${year ? `/${year}` : ""}`;

    onChange(normalized);
  };

  return (
    <div className="relative">
      <input
        type="text"
        value={displayValue}
        onChange={(e) => handleInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Tab" || e.key === "ArrowLeft" || e.key === "ArrowRight" || e.key === "Backspace" || e.key === "Delete") return;
          if (!/[0-9]/.test(e.key)) e.preventDefault();
        }}
        onPaste={(e) => {
          e.preventDefault();
          const text = (e.clipboardData.getData("text") || "").replace(/\D/g, "").slice(0, 8);
          handleInput(text);
        }}
        autoComplete="off"
        inputMode="numeric"
        placeholder={placeholder}
        maxLength={10}
        disabled={disabled}
        className="w-full px-3 py-2.5 pr-10 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
      />
      <input
        ref={nativeInputRef}
        type="date"
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        tabIndex={-1}
        aria-hidden="true"
        className="absolute inset-0 opacity-0 pointer-events-none"
      />
      <button
        type="button"
        disabled={disabled}
        onClick={() => nativeInputRef.current?.showPicker?.() || nativeInputRef.current?.click()}
        className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-500 hover:text-blue-600 transition-colors z-10 disabled:cursor-not-allowed disabled:opacity-50"
        aria-label="Abrir calendario"
      >
        <Calendar size={16} />
      </button>
    </div>
  );
}

const step1Schema = z.object({
  empresa: z.enum(["Humax", "Farmatech", "Cambridge"]),
  centroCostos: requiredString("Centro de costos").refine((value) => value.trim().length > 0, "Seleccione un centro de costos"),
  fecha: dateStringSchema,
  responsable: requiredString("Responsable"),
  area: requiredString("Área"),
});
const step2Schema = z.object({
  descripcion: z.string().min(3, "Debe tener mínimo 3 caracteres"),
  codigoSAP: requiredString("Código SAP"),
  numeroLote: requiredString("Número de lote"),
  ordenProduccion: requiredString("Orden de producción"),
  sustanciaControlada: z
    .any()
    .refine((value) => value === true || value === false, {
      message: "Seleccione si o no",
    }),
  clasificacion: z.enum(["materia_prima", "producto_semiterminado", "granel", "producto_terminado", "material_empaque", "reactivos", "remanentes", "muestras", "otro"] as const),
  fechaVencimiento: z
    .any()
    .refine((value) => typeof value === "string" && value.trim().length > 0, {
      message: "Fecha de vencimiento obligatoria",
    })
    .refine((value) => typeof value !== "string" || /^\d{4}-\d{2}-\d{2}$/.test(value), {
      message: "La fecha debe tener el formato DD/MM/YYYY",
    }),
  registroINVIMA: requiredString("Registro INVIMA"),
  otraClasificacion: z.string().optional(),
});
const numberField = (label: string, maxValue: number, integer = false) =>
  z.any().superRefine((value, ctx) => {
    if (value === "" || value === null || value === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `${label} es obligatorio`,
      });
      return;
    }

    const raw = String(value).trim();
    const numericValue = Number(raw);

    if (!raw || !Number.isFinite(numericValue)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Ingrese un valor válido para ${label}`,
      });
      return;
    }

    if (numericValue <= 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `${label} debe ser mayor a 0`,
      });
      return;
    }

    if (integer && !Number.isInteger(numericValue)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `${label} debe ser un número entero`,
      });
      return;
    }

    if (numericValue > maxValue) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `${label} no puede exceder ${maxValue.toLocaleString("es-CO")}`,
      });
    }
  });

const step3Schema = z.object({
  pesoKg: numberField("Peso", 10000000000000),
  cantidadUnidades: numberField("Cantidad", 10000000000000, true),
  costoDestruccion: numberField("Costo de destrucción", 10000000000000),
});

type Step1Data = z.infer<typeof step1Schema>;
type Step2Data = z.infer<typeof step2Schema>;
type Step3Data = z.infer<typeof step3Schema>;

function FieldError({ message }: { message?: string | { message?: string } | unknown }) {
  const text = typeof message === "string"
    ? message
    : typeof message === "object" && message !== null && "message" in message
      ? String((message as { message?: string }).message ?? "")
      : "";

  if (!text) return null;

  return (
    <p className="mt-1 flex items-center gap-1.5 text-xs text-red-600">
      <AlertTriangle size={12} className="shrink-0" />
      <span>{text}</span>
    </p>
  );
}

export default function ActaCreatePage() {
  const { user } = useAuth();
  const { id } = useParams();
  const { actas, createActa, updateActa, sendActa, invimaProducts } = useApp();
  const navigate = useNavigate();
  const editingActa = id ? actas.find((acta) => acta.id === id) : undefined;
  const isEditing = !!editingActa;

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
  const [cecos, setCecos] = useState<Ceco[]>([]);
  const [cecoSearch, setCecoSearch] = useState("");
  const [showCecoModal, setShowCecoModal] = useState(false);
  const isAreaFixed = user?.rol === "solicitante" && !!user?.area;
  const isGeneralInfoLocked = isEditing;

  useEffect(() => {
    api.getCecos().then((data: unknown) => {
      if (Array.isArray(data)) setCecos(data as Ceco[]);
    }).catch(() => {
      toast.error("No se pudo cargar el maestro de CeCos");
    });
  }, []);

  const form1 = useForm<Step1Data>({
    resolver: zodResolver(step1Schema),
    defaultValues: {
      fecha: new Date().toISOString().split("T")[0],
      empresa: "Humax",
      area: user?.area || "",
    },
  });
  const form2 = useForm<Step2Data>({ resolver: zodResolver(step2Schema), defaultValues: { clasificacion: "producto_terminado" } });
  const form3 = useForm<Step3Data>({
    resolver: zodResolver(step3Schema),
    defaultValues: { pesoKg: 0, cantidadUnidades: 0, costoDestruccion: 0 },
  });

  const form1Values = form1.watch();
  const form2Values = form2.watch();
  const form3Values = form3.watch();

  useEffect(() => {
    if (user?.area) {
      form1.setValue("area", user.area, { shouldValidate: true });
    }
  }, [user?.area, form1]);

  useEffect(() => {
    if (!editingActa) return;

    form1.reset({
      empresa: editingActa.empresa,
      centroCostos: editingActa.centroCostos,
      fecha: editingActa.fecha,
      responsable: editingActa.responsable,
      area: editingActa.area,
    });
    form2.reset({
      descripcion: editingActa.descripcion,
      codigoSAP: editingActa.codigoSAP,
      numeroLote: editingActa.numeroLote,
      ordenProduccion: editingActa.ordenProduccion,
      sustanciaControlada: editingActa.sustanciaControlada,
      clasificacion: editingActa.clasificacion,
      fechaVencimiento: editingActa.fechaVencimiento,
      registroINVIMA: editingActa.registroINVIMA,
      otraClasificacion: undefined,
    });
    form3.reset({
      pesoKg: editingActa.pesoKg,
      cantidadUnidades: editingActa.cantidadUnidades,
      costoDestruccion: editingActa.costoDestruccion,
    });
    setFormData({
      ...editingActa,
      otraClasificacion: undefined,
    });
    setSelectedEmpresa(editingActa.empresa);
    setSelectedCausal(editingActa.causal);
    setPendingCausal(editingActa.causal);
    setOtraCausal(editingActa.otraCausal || "");
    setObservaciones(editingActa.observaciones || "");
    setAdjuntos(Array.isArray(editingActa.adjuntos) ? editingActa.adjuntos : []);
    setCurrentStep(1);
    setCompletedSteps([0]);
    setInvimaSearch(editingActa.registroINVIMA);
  }, [editingActa]);

  useEffect(() => {
    try {
      const savedDraft = window.localStorage.getItem(ACTA_DRAFT_STORAGE_KEY);
      if (!savedDraft) return;

      const parsedDraft = JSON.parse(savedDraft) as {
        currentStep?: number;
        form1?: Partial<Step1Data>;
        form2?: Partial<Step2Data>;
        form3?: Partial<Step3Data>;
        selectedCausal?: CausalDestruccion | null;
        pendingCausal?: CausalDestruccion | null;
        otraCausal?: string;
        observaciones?: string;
        adjuntos?: string[];
        selectedEmpresa?: Empresa;
      };

      if (!parsedDraft) return;

      form1.reset({ ...form1.getValues(), ...parsedDraft.form1 });
      form2.reset({ ...form2.getValues(), ...parsedDraft.form2 });
      form3.reset({ ...form3.getValues(), ...parsedDraft.form3 });
      setCurrentStep(typeof parsedDraft.currentStep === "number" ? parsedDraft.currentStep : 0);
      setSelectedCausal(parsedDraft.selectedCausal ?? null);
      setPendingCausal(parsedDraft.pendingCausal ?? null);
      setOtraCausal(parsedDraft.otraCausal ?? "");
      setObservaciones(parsedDraft.observaciones ?? "");
      setAdjuntos(parsedDraft.adjuntos ?? []);
      setSelectedEmpresa(parsedDraft.selectedEmpresa ?? "Humax");
    } catch {
      // Ignorar errores de almacenamiento local
    }
  }, []);

  useEffect(() => {
    const persistDraft = () => {
      try {
        const payload = {
          currentStep,
          form1: form1Values,
          form2: form2Values,
          form3: form3Values,
          selectedCausal,
          pendingCausal,
          otraCausal,
          observaciones,
          adjuntos,
          selectedEmpresa,
        };
        window.localStorage.setItem(ACTA_DRAFT_STORAGE_KEY, JSON.stringify(payload));
      } catch {
        // Ignorar errores de almacenamiento local
      }
    };

    persistDraft();

    return () => {
      const path = window.location.pathname;
      if (path !== "/actas/nueva") {
        window.localStorage.removeItem(ACTA_DRAFT_STORAGE_KEY);
      }
    };
  }, [currentStep, form1Values, form2Values, form3Values, selectedCausal, pendingCausal, otraCausal, observaciones, adjuntos, selectedEmpresa]);

  const empresaWatch = form1.watch("empresa");
  const centroCostosWatch = form1.watch("centroCostos");
  const cecosByEmpresa = cecos.filter((c) => c.empresa === empresaWatch);
  const filteredCecos = cecosByEmpresa.filter((c) => {
    const query = cecoSearch.toLowerCase().trim();
    if (!query) return true;
    return [c.ceco, c.denominacion, c.responsable, c.departamento]
      .some((value) => value.toLowerCase().includes(query));
  });

  const selectedCeco = cecos.find((c) =>
    `${c.ceco} - ${c.denominacion}` === centroCostosWatch && c.empresa === empresaWatch
  );

  useEffect(() => {
    if (centroCostosWatch && !cecosByEmpresa.some((c) => `${c.ceco} - ${c.denominacion}` === centroCostosWatch)) {
      form1.setValue("centroCostos", "", { shouldValidate: true });
    }
  }, [empresaWatch, centroCostosWatch, cecosByEmpresa, form1]);

  const selectCeco = (ceco: Ceco) => {
    form1.setValue("centroCostos", `${ceco.ceco} - ${ceco.denominacion}`, { shouldValidate: true, shouldDirty: true });
    setShowCecoModal(false);
    setCecoSearch("");
  };

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
    if (!isEditing) {
      setFormData((prev) => ({ ...prev, ...data }));
      setSelectedEmpresa(data.empresa);
    }
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
  };

  const handleSaveDraft = async () => {
    if (!user || !selectedCausal) return;
    try {
      const data = { ...formData } as any;
      if (editingActa) {
        await updateActa(editingActa.id, {
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
          status: "borrador",
        });
        window.localStorage.removeItem(ACTA_DRAFT_STORAGE_KEY);
        toast.success("Borrador actualizado correctamente");
        navigate(`/actas/${editingActa.id}`);
        return;
      }
      const acta = await createActa({
      status: "borrador",
      empresa: data.empresa || "Humax",
      centroCostos: data.centroCostos || "",
      fecha: data.fecha || "",
      solicitanteId: user.id,
      solicitanteNombre: user.nombre,
      responsable: data.responsable || "",
      area: isAreaFixed ? user.area : (data.area || ""),
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
      window.localStorage.removeItem(ACTA_DRAFT_STORAGE_KEY);
      toast.success(`Borrador guardado: ${acta.consecutivo}`);
      navigate("/actas");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo guardar el borrador");
    }
  };

  const handleSendApproval = async () => {
    if (!user || !selectedCausal) return;
    try {
      const data = { ...formData } as any;
      if (editingActa) {
        await updateActa(editingActa.id, {
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
        await sendActa(editingActa.id, user.id, user.nombre);
        window.localStorage.removeItem(ACTA_DRAFT_STORAGE_KEY);
        toast.success(`Acta ${editingActa.consecutivo} enviada a aprobación`);
        navigate(`/actas/${editingActa.id}`);
        return;
      }
      const acta = await createActa({
      status: "enviada",
      empresa: data.empresa || "Humax",
      centroCostos: data.centroCostos || "",
      fecha: data.fecha || "",
      solicitanteId: user.id,
      solicitanteNombre: user.nombre,
      responsable: data.responsable || "",
      area: isAreaFixed ? user.area : (data.area || ""),
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
      await sendActa(acta.id, user.id, user.nombre);
      window.localStorage.removeItem(ACTA_DRAFT_STORAGE_KEY);
      toast.success(`Acta ${acta.consecutivo} enviada a aprobación`);
      navigate(`/actas/${acta.id}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo crear el acta");
    }
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
          <h1 className="text-xl font-bold text-slate-900">{isEditing ? "Editar Acta de Destrucción" : "Nueva Acta de Destrucción"}</h1>
          <p className="text-sm text-slate-500 mt-0.5">{isEditing ? "La información general está bloqueada; edite desde la información del material." : "Complete todos los pasos para crear el acta"}</p>
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
          <form onSubmit={onStep1} noValidate className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Empresa *</label>
                <select disabled={isGeneralInfoLocked} {...form1.register("empresa")} className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed">
                  {EMPRESAS.map((e) => <option key={e} value={e}>{e}</option>)}
                </select>
                <FieldError message={form1.formState.errors.empresa?.message} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Centro de Costos *</label>
                <input type="hidden" {...form1.register("centroCostos")} />
                <button
                  type="button"
                  disabled={isGeneralInfoLocked || !empresaWatch}
                  onClick={() => setShowCecoModal(true)}
                  className="w-full flex items-center justify-between gap-3 px-3 py-2.5 text-sm text-left border border-slate-300 rounded-lg bg-white hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                >
                  <span className={selectedCeco ? "text-slate-800" : "text-slate-400"}>
                    {selectedCeco ? `${selectedCeco.ceco} - ${selectedCeco.denominacion}` : "Seleccione un CeCo"}
                  </span>
                  <Search size={16} className="shrink-0 text-slate-400" />
                </button>
                <FieldError message={form1.formState.errors.centroCostos?.message} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Fecha de solicitud *</label>
                <DateField
                  value={form1.watch("fecha")}
                  onChange={(value) => form1.setValue("fecha", value, { shouldValidate: true, shouldDirty: true })}
                  disabled={isGeneralInfoLocked}
                />
                <FieldError message={form1.formState.errors.fecha?.message} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Solicitante</label>
                <input type="text" value={user?.nombre || ""} disabled className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg bg-slate-100 text-slate-500 font-medium cursor-not-allowed pointer-events-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Responsable *</label>
                <input disabled={isGeneralInfoLocked} {...form1.register("responsable")} placeholder="Nombre del responsable" className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed" />
                <FieldError message={form1.formState.errors.responsable?.message} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{isAreaFixed ? "Área registrada" : "Área *"}</label>
                {isAreaFixed ? (
                  <>
                    <input
                      type="text"
                      value={user?.area || form1.watch("area") || ""}
                      disabled
                      className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg bg-slate-100 text-slate-500 font-medium cursor-not-allowed pointer-events-none"
                    />
                    <p className="text-xs text-slate-500 mt-1">Tu usuario está registrado en esta área.</p>
                  </>
                ) : (
                  <>
                    <select
                      disabled={isGeneralInfoLocked}
                      {...form1.register("area")}
                      value={user?.area || form1.watch("area") || ""}
                      onChange={(e) => form1.setValue("area", e.target.value, { shouldValidate: true })}
                      className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                    >
                      <option value="">Seleccione un área</option>
                      {AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
                    </select>
                  </>
                )}
                <FieldError message={form1.formState.errors.area?.message} />
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <button type="submit" className="h-11 min-w-[140px] px-5 py-2.5 rounded-lg text-sm font-medium bg-blue-700 text-white hover:bg-blue-800 transition-colors">
                Siguiente →
              </button>
            </div>
          </form>
        </div>
      )}

      <Modal open={showCecoModal} onClose={() => setShowCecoModal(false)} title={`Seleccionar CeCo · ${empresaWatch}`} size="lg">
        <div className="space-y-4">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input autoFocus value={cecoSearch} onChange={(event) => setCecoSearch(event.target.value)} placeholder="Buscar por código, denominación, responsable..." className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>{filteredCecos.length} CeCos encontrados</span>
            <span className="font-medium text-blue-700">{empresaWatch}</span>
          </div>
          <div className="max-h-[50vh] overflow-auto border border-slate-200 rounded-lg">
            {filteredCecos.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500">No hay CeCos que coincidan con la búsqueda.</div>
            ) : (
              <table className="min-w-[680px] w-full text-sm">
                <thead className="sticky top-0 bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">CeCo</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Denominación</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Responsable</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Departamento</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredCecos.map((ceco) => (
                    <tr key={ceco.id || `${ceco.empresaCode}-${ceco.ceco}`} onClick={() => selectCeco(ceco)} className="cursor-pointer hover:bg-blue-50 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs font-semibold text-blue-700">{ceco.ceco}</td>
                      <td className="px-4 py-3 font-medium text-slate-800">{ceco.denominacion}</td>
                      <td className="px-4 py-3 text-slate-600">{ceco.responsable || "Sin responsable"}</td>
                      <td className="px-4 py-3 text-xs text-slate-500">{ceco.departamento || "Sin departamento"}</td>
                      <td className="px-4 py-3 text-xs text-slate-500">{ceco.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </Modal>

      {/* Step 2: Material Info */}
      {currentStep === 1 && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-base font-semibold text-slate-800 mb-5">Paso 2 — Información del Material</h2>
          <form onSubmit={onStep2} noValidate className="space-y-4">
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
              <FieldError message={form2.formState.errors.registroINVIMA?.message} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Descripción del material *</label>
                <input {...form2.register("descripcion")} placeholder="Nombre, concentración y presentación" className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <FieldError message={form2.formState.errors.descripcion?.message} />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">¿Es sustancia controlada?</label>
                <div className="flex gap-3">
                  <label className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium cursor-pointer transition-all ${form2.watch("sustanciaControlada") === true ? "border-blue-300 bg-blue-50 text-blue-700 ring-1 ring-blue-200 shadow-[0_0_0_1px_rgba(191,219,254,0.45)]" : "border-slate-300 hover:border-blue-300 bg-white text-slate-700"}`}>
                    <input
                      type="radio"
                      checked={form2.watch("sustanciaControlada") === true}
                      onChange={() => form2.setValue("sustanciaControlada", true, { shouldValidate: true, shouldDirty: true })}
                      className="h-4 w-4 accent-blue-600"
                    />
                    <span>Sí</span>
                  </label>
                  <label className={`flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-medium cursor-pointer transition-all ${form2.watch("sustanciaControlada") === false ? "border-blue-300 bg-blue-50 text-blue-700 ring-1 ring-blue-200 shadow-[0_0_0_1px_rgba(191,219,254,0.45)]" : "border-slate-300 hover:border-blue-300 bg-white text-slate-700"}`}>
                    <input
                      type="radio"
                      checked={form2.watch("sustanciaControlada") === false}
                      onChange={() => form2.setValue("sustanciaControlada", false, { shouldValidate: true, shouldDirty: true })}
                      className="h-4 w-4 accent-blue-600"
                    />
                    <span>No</span>
                  </label>
                </div>
                <FieldError message={form2.formState.errors.sustanciaControlada?.message} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Código SAP *</label>

                <input {...form2.register("codigoSAP")} placeholder="SAP-XXXXX" className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <FieldError message={form2.formState.errors.codigoSAP?.message} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Número de Lote *</label>
                <input {...form2.register("numeroLote")} placeholder="LOT-XXXX o NO APLICA" className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <FieldError message={form2.formState.errors.numeroLote?.message} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Orden de Producción *</label>
                <input {...form2.register("ordenProduccion")} placeholder="OP-XXXX o NO APLICA" className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <FieldError message={form2.formState.errors.ordenProduccion?.message} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Fecha de Vencimiento *</label>
                <DateField
                  value={form2.watch("fechaVencimiento")}
                  onChange={(value) => form2.setValue("fechaVencimiento", value, { shouldValidate: true, shouldDirty: true })}
                />
                <FieldError message={form2.formState.errors.fechaVencimiento?.message} />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">Clasificación *</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {Object.entries(CLASIFICACION_LABELS).map(([val, lbl]) => (
                    <label key={val} className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm cursor-pointer transition-all ${form2.watch("clasificacion") === val ? "border-blue-500 bg-blue-50 text-blue-700" : "border-slate-200 hover:border-slate-300"}`}>
                      <input
                        {...form2.register("clasificacion")}
                        type="radio"
                        value={val}
                        className="h-4 w-4 accent-blue-600 shrink-0"
                      />
                      <span>{lbl}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-between pt-2">
              <button type="button" onClick={() => setCurrentStep(0)} className="h-11 min-w-[140px] px-4 py-2.5 text-sm text-slate-700 font-medium bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">← Anterior</button>
              <button type="submit" className="h-11 min-w-[140px] px-5 py-2.5 rounded-lg text-sm font-medium bg-blue-700 text-white hover:bg-blue-800 transition-colors">Siguiente →</button>
            </div>
          </form>
        </div>
      )}

      {/* Step 3: Economic Info */}
      {currentStep === 2 && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-base font-semibold text-slate-800 mb-5">Paso 3 — Información Económica</h2>
          <form onSubmit={onStep3} noValidate className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Peso (kg) *</label>
                <input
                  {...form3.register("pesoKg")}
                  type="text"
                  inputMode="decimal"
                  placeholder="0.000"
                  maxLength={12}
                  className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <FieldError message={form3.formState.errors.pesoKg?.message} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Cantidad (unidades) *</label>
                <input
                  {...form3.register("cantidadUnidades")}
                  type="text"
                  inputMode="numeric"
                  maxLength={9}
                  placeholder="0"
                  className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <FieldError message={form3.formState.errors.cantidadUnidades?.message} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Costo de destrucción (COP) *</label>
                <input
                  {...form3.register("costoDestruccion")}
                  type="text"
                  inputMode="numeric"
                  maxLength={13}
                  placeholder="0"
                  className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <FieldError message={form3.formState.errors.costoDestruccion?.message} />
              </div>
            </div>
            <div className="flex justify-between pt-2">
              <button type="button" onClick={() => setCurrentStep(1)} className="h-11 min-w-[140px] px-4 py-2.5 text-sm text-slate-700 font-medium bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">← Anterior</button>
              <button type="submit" className="h-11 min-w-[140px] px-5 py-2.5 rounded-lg text-sm font-medium bg-blue-700 text-white hover:bg-blue-800 transition-colors">Siguiente →</button>
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
            <button onClick={() => setCurrentStep(2)} className="h-11 min-w-[140px] px-4 py-2.5 text-sm text-slate-700 font-medium bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">← Anterior</button>
            <button
              onClick={() => { if (selectedCausal) { setCompletedSteps((p) => [...new Set([...p, 3])]); setCurrentStep(4); } else toast.error("Seleccione al menos una causal"); }}
              className="h-11 min-w-[140px] px-5 py-2.5 rounded-lg text-sm font-medium bg-blue-700 text-white hover:bg-blue-800 transition-colors"
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
            <button onClick={() => setCurrentStep(3)} className="h-11 min-w-[140px] px-4 py-2.5 text-sm text-slate-700 font-medium bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">← Anterior</button>
            <button
              onClick={() => { setCompletedSteps((p) => [...new Set([...p, 4])]); setCurrentStep(5); }}
              className="h-11 min-w-[140px] px-5 py-2.5 rounded-lg text-sm font-medium bg-blue-700 text-white hover:bg-blue-800 transition-colors"
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
            <button onClick={() => setCurrentStep(4)} className="h-11 min-w-[140px] px-4 py-2.5 text-sm text-slate-700 font-medium bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">← Anterior</button>
            <div className="flex gap-3">
              <button onClick={handleSaveDraft} className="h-11 min-w-[140px] px-5 py-2.5 text-sm font-medium border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors">
                Guardar Borrador
              </button>
              <button onClick={handleSendApproval} className="h-11 min-w-[170px] px-5 py-2.5 rounded-lg text-sm font-semibold bg-blue-700 text-white hover:bg-blue-800 transition-colors flex items-center justify-center gap-2">
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
