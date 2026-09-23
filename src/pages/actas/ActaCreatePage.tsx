import { useState, useCallback, useEffect, useRef, type ReactNode } from "react";
import { useNavigate, useParams } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Calendar, Package, AlertTriangle, CheckCircle2, Info, Upload, X,
  Trash2, RotateCcw, Zap, ShieldOff, Wrench, HelpCircle, Search, Loader2
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useApp } from "../../context/AppContext";
import { Stepper, ProgressBar } from "../../components/ui/Stepper";
import { ConfirmModal, Modal } from "../../components/ui/Modal";
import {
  CLASIFICACION_LABELS, CAUSAL_LABELS, CAUSAL_DESCRIPTIONS, EMPRESAS, AREAS
} from "../../constants";
import type { ActaMaterial, CausalDestruccion, Ceco, Empresa, InvimaProduct } from "../../types";
import { api } from "../../services/api.ts";
import { toast } from "sonner";

const ACTA_DRAFT_STORAGE_KEY = "humax-acta-draft";

const STEPS = [
  { label: "Info General" },
  { label: "Condición de control" },
  { label: "Material" },
  { label: "Económica" },
  { label: "Causal" },
  { label: "Observaciones" },
  { label: "Resumen" },
];

const MATERIAL_CLASSIFICATIONS = [
  { value: "PT", label: "Producto terminado", detail: "Se consulta en el maestro INVIMA" },
  { value: "ME", label: "Material de empaque", detail: "Se consulta en el maestro SAP" },
  { value: "MP", label: "Materia prima", detail: "Se consulta en el maestro SAP" },
  { value: "ST", label: "Semiterminado", detail: "Se consulta en el maestro de materiales" },
  { value: "SQ", label: "Sustancia química", detail: "Se consulta en el maestro SAP" },
  { value: "reactivos", label: "Material de laboratorio", detail: "UNBW o material de laboratorio" },
  { value: "residuo_comun", label: "Común o residuo común peligroso", detail: "Puede usar N/A en INVIMA" },
  { value: "residuo_aprovechable", label: "Residuo aprovechable", detail: "Información manual" },
] as const;

const MATERIAL_TYPE_OPTIONS = [
  { value: "ROH", classification: "MP", label: "ROH = Materia prima", meaning: "Materia prima: insumos y sustancias que se utilizan para fabricar el producto." },
  { value: "FERT", classification: "PT", label: "FERT = Producto terminado", meaning: "Producto terminado: producto listo para comercialización o entrega." },
  { value: "HALB", classification: "ST", label: "HALB = Semiterminado", meaning: "Semiterminado: material que requiere una etapa adicional antes de convertirse en producto terminado." },
  { value: "ME", classification: "ME", label: "ME = Material de empaque", meaning: "Material de empaque: envases, etiquetas, blísteres y otros materiales de acondicionamiento." },
  { value: "UNBW", classification: "reactivos", label: "UNBW = Reactivo o material de laboratorio", meaning: "Reactivo o material de laboratorio: sustancias y materiales usados para análisis, control o referencia." },
] as const;

const INVIMA_CLASSIFICATIONS = new Set(["MP", "ME", "PT"]);

const normalizeMaterialType = (value: unknown) => {
  const normalized = String(value || "")
    .trim()
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[\s_-]+/g, "");
  const aliases: Record<string, string> = {
    ROH: "ROH",
    MATERIAPRIMA: "ROH",
    FERT: "FERT",
    PRODUCTOTERMINADO: "FERT",
    HALB: "HALB",
    SEMITERMINADO: "HALB",
    PRODUCTOSEMITERMINADO: "HALB",
    ME: "ME",
    VERP: "ME",
    ZEMB: "ME",
    MATERIALEMPAQUE: "ME",
    UNBW: "UNBW",
    REACTIVO: "UNBW",
    REACTIVOS: "UNBW",
    MATERIALDELABORATORIO: "UNBW",
  };
  return aliases[normalized] || String(value || "").trim().toUpperCase();
};

const isControlledMaterial = (product: InvimaProduct) =>
  product.controlado || ["PT", "FERT"].includes(String(product.clase || "").trim().toUpperCase());

const normalizeClassification = (value: unknown) => {
  const normalized = String(value || "").trim().toUpperCase();
  const aliases: Record<string, string> = {
    ROH: "MP",
    FERT: "PT",
    HALB: "ST",
    UNBW: "reactivos",
    REACTIVOS: "reactivos",
    RESIDUO_COMUN: "residuo_comun",
    RESIDUO_APROVECHABLE: "residuo_aprovechable",
    MATERIA_PRIMA: "materia_prima",
    PRODUCTO_SEMITERMINADO: "producto_semiterminado",
    PRODUCTO_TERMINADO: "producto_terminado",
    MATERIAL_EMPAQUE: "material_empaque",
  };
  if (aliases[normalized]) return aliases[normalized];
  return value;
};

const getMaterialClassification = (product: InvimaProduct) => {
  const classification = (product.clase || "").trim().toUpperCase();
  if (INVIMA_CLASSIFICATIONS.has(classification)) return classification;

  const materialCode = (product.codigoMaterial || "").trim().toUpperCase();
  return MATERIAL_TYPE_OPTIONS.find((option) => option.value === materialCode)?.classification || classification;
};

const getMaterialTypeCode = (product: InvimaProduct) => {
  const materialType = normalizeMaterialType(product.clase);
  const materialCode = (product.codigoMaterial || "").trim().toUpperCase();
  const optionByType = MATERIAL_TYPE_OPTIONS.find((option) => option.value === materialType);
  if (optionByType) return optionByType.value;

  return MATERIAL_TYPE_OPTIONS.find((option) => option.classification === normalizeClassification(materialType))?.value || materialType;
};

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
  cecoId: z.string().optional(),
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
  clasificacion: z.enum(["PT", "ME", "MP", "ST", "SQ", "residuo_comun", "residuo_aprovechable", "materia_prima", "producto_semiterminado", "granel", "producto_terminado", "material_empaque", "reactivos", "remanentes", "muestras", "otro"] as const),
  fechaVencimiento: z
    .any()
    .refine((value) => typeof value === "string" && value.trim().length > 0, {
      message: "Fecha de vencimiento obligatoria",
    })
    .refine((value) => typeof value !== "string" || /^\d{4}-\d{2}-\d{2}$/.test(value), {
      message: "La fecha debe tener el formato DD/MM/YYYY",
    }),
  registroINVIMA: requiredString("Registro INVIMA"),
  estadoInvima: z.enum(["Vigente", "Vencido", "Cancelado", "N/A"] as const),
  invimaProductId: z.string().optional(),
  sapCodeId: z.string().optional(),
  tipoMaterial: z.string().optional(),
});
const numberField = (label: string, maxValue: number, integer = false, allowZero = false) =>
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

    if (numericValue < 0 || (!allowZero && numericValue === 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `${label} debe ser ${allowZero ? "mayor o igual a 0" : "mayor a 0"}`,
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
  costoDestruccion: numberField("Costo del material", 10000000000000, false, true),
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
  const isReturnedForAdjustments = editingActa?.status === "devuelta_ajustes";

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
  const [showInvimaModal, setShowInvimaModal] = useState(false);
  const [sapCodes, setSapCodes] = useState<InvimaProduct[]>([]);
  const [sapSearch, setSapSearch] = useState("");
  const [showSapModal, setShowSapModal] = useState(false);
  const [showMaterialTypeModal, setShowMaterialTypeModal] = useState(false);
  const [showMoreProductsModal, setShowMoreProductsModal] = useState(false);
  const [showMaterialWarningModal, setShowMaterialWarningModal] = useState(false);
  const [materialNotice, setMaterialNotice] = useState("");
  const [materials, setMaterials] = useState<ActaMaterial[]>([]);
  const [removeMaterialIndex, setRemoveMaterialIndex] = useState<number | null>(null);
  const [materialPage, setMaterialPage] = useState(0);
  const [editingMaterialIndex, setEditingMaterialIndex] = useState<number | null>(null);
  const [summaryMaterialPage, setSummaryMaterialPage] = useState(0);
  const [costoNoAplica, setCostoNoAplica] = useState(false);
  const [isSendingApproval, setIsSendingApproval] = useState(false);
  const [sendingConsecutivo, setSendingConsecutivo] = useState("");
  const [maxStepReached, setMaxStepReached] = useState(0);
  const draftLoadedRef = useRef(false);
  const [cecos, setCecos] = useState<Ceco[]>([]);
  const [cecoSearch, setCecoSearch] = useState("");
  const [showCecoModal, setShowCecoModal] = useState(false);
  const isAreaFixed = user?.rol === "solicitante" && !!user?.area;
  const isGeneralInfoLocked = isEditing && !isReturnedForAdjustments;

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
  const form2 = useForm<Step2Data>({ resolver: zodResolver(step2Schema), defaultValues: { estadoInvima: "N/A" } });
  const form3 = useForm<Step3Data>({
    resolver: zodResolver(step3Schema),
    defaultValues: { pesoKg: 0, cantidadUnidades: 0, costoDestruccion: 0 },
  });

  const form1Values = form1.watch();
  const form2Values = form2.watch();
  const form3Values = form3.watch();
  const materialSummary = formData.descripcion
    ? materialsForSave(formData as Step2Data)
    : materials;

  useEffect(() => {
    if (user?.area) {
      form1.setValue("area", user.area, { shouldValidate: true });
    }
  }, [user?.area, form1]);

  useEffect(() => {
    setMaxStepReached((previous) => Math.max(previous, currentStep));
  }, [currentStep]);

  useEffect(() => {
    if (!editingActa) return;

    form1.reset({
      empresa: editingActa.empresa,
      centroCostos: editingActa.centroCostos,
      fecha: editingActa.fecha ? editingActa.fecha.slice(0, 10) : "",
      responsable: editingActa.responsable,
      area: editingActa.area,
    });
    form2.reset({
      descripcion: editingActa.descripcion,
      codigoSAP: editingActa.codigoSAP,
      numeroLote: editingActa.numeroLote,
      ordenProduccion: editingActa.ordenProduccion,
      sustanciaControlada: editingActa.sustanciaControlada,
      clasificacion: normalizeClassification(editingActa.clasificacion) as Step2Data["clasificacion"],
      fechaVencimiento: editingActa.fechaVencimiento ? editingActa.fechaVencimiento.slice(0, 10) : "",
      registroINVIMA: editingActa.registroINVIMA,
      estadoInvima: editingActa.estadoInvima || "N/A",
      tipoMaterial: editingActa.tipoMaterial,
    });
    const existingMaterials = editingActa.materiales || [];
    if (existingMaterials.length > 1) {
      setMaterials(existingMaterials.slice(0, -1));
      const lastMaterial = existingMaterials[existingMaterials.length - 1];
      form2.reset({
        descripcion: lastMaterial.descripcion,
        codigoSAP: lastMaterial.codigoSAP,
        numeroLote: lastMaterial.numeroLote,
        ordenProduccion: lastMaterial.ordenProduccion,
        sustanciaControlada: lastMaterial.sustanciaControlada,
        clasificacion: normalizeClassification(lastMaterial.clasificacion) as Step2Data["clasificacion"],
        fechaVencimiento: lastMaterial.fechaVencimiento ? lastMaterial.fechaVencimiento.slice(0, 10) : "",
        registroINVIMA: lastMaterial.registroINVIMA,
        estadoInvima: lastMaterial.estadoInvima || "N/A",
        tipoMaterial: lastMaterial.tipoMaterial,
        invimaProductId: lastMaterial.invimaProductId,
        sapCodeId: lastMaterial.sapCodeId,
      });
    } else {
      setMaterials([]);
    }
    const currentEconomicMaterial = existingMaterials[existingMaterials.length - 1];
    form3.reset({
      pesoKg: currentEconomicMaterial?.pesoKg ?? editingActa.pesoKg,
      cantidadUnidades: currentEconomicMaterial?.cantidadUnidades ?? editingActa.cantidadUnidades,
      costoDestruccion: currentEconomicMaterial?.costoUnitario ?? editingActa.costoDestruccion,
    });
    setCostoNoAplica(Number(editingActa.costoDestruccion) === 0);
    setFormData({
      ...editingActa,
      tipoMaterial: editingActa.tipoMaterial,
    });
    setSelectedEmpresa(editingActa.empresa);
    setSelectedCausal(editingActa.causal);
    setPendingCausal(editingActa.causal);
    setOtraCausal(editingActa.otraCausal || "");
    setObservaciones(editingActa.observaciones || "");
    setAdjuntos(Array.isArray(editingActa.adjuntos) ? editingActa.adjuntos : []);
    setCurrentStep(2);
    setCompletedSteps([0, 1]);
    setInvimaSearch(editingActa.registroINVIMA);
  }, [editingActa]);

  useEffect(() => {
    try {
      const savedDraft = window.localStorage.getItem(ACTA_DRAFT_STORAGE_KEY);
      if (!savedDraft) {
        draftLoadedRef.current = true;
        return;
      }

      const parsedDraft = JSON.parse(savedDraft) as {
        currentStep?: number;
        maxStepReached?: number;
        form1?: Partial<Step1Data>;
        form2?: Partial<Step2Data>;
        form3?: Partial<Step3Data>;
        selectedCausal?: CausalDestruccion | null;
        pendingCausal?: CausalDestruccion | null;
        otraCausal?: string;
        observaciones?: string;
        adjuntos?: string[];
        selectedEmpresa?: Empresa;
        materials?: ActaMaterial[];
        costoNoAplica?: boolean;
      };

      if (!parsedDraft) return;

      form1.reset({ ...form1.getValues(), ...parsedDraft.form1 });
      form2.reset({ ...form2.getValues(), ...parsedDraft.form2 });
      form3.reset({ ...form3.getValues(), ...parsedDraft.form3 });
      setCurrentStep(typeof parsedDraft.currentStep === "number" ? parsedDraft.currentStep : 0);
      setMaxStepReached(typeof parsedDraft.maxStepReached === "number" ? parsedDraft.maxStepReached : parsedDraft.currentStep || 0);
      setSelectedCausal(parsedDraft.selectedCausal ?? null);
      setPendingCausal(parsedDraft.pendingCausal ?? null);
      setOtraCausal(parsedDraft.otraCausal ?? "");
      setObservaciones(parsedDraft.observaciones ?? "");
      setAdjuntos(parsedDraft.adjuntos ?? []);
      setSelectedEmpresa(parsedDraft.selectedEmpresa ?? "Humax");
      setMaterials(parsedDraft.materials ?? []);
      setCostoNoAplica(parsedDraft.costoNoAplica ?? false);
    } catch {
      // Ignorar errores de almacenamiento local
    } finally {
      draftLoadedRef.current = true;
    }
  }, []);

  useEffect(() => {
    setMaterialPage((previous) => Math.min(previous, Math.max(materials.length - 1, 0)));
  }, [materials.length]);

  useEffect(() => {
    const total = materialSummary.length;
    setSummaryMaterialPage((previous) => Math.min(previous, Math.max(total - 1, 0)));
  }, [materialSummary.length]);

  useEffect(() => {
    if (!draftLoadedRef.current) return;

    const persistDraft = () => {
      try {
        const payload = {
          currentStep,
          maxStepReached,
          form1: form1Values,
          form2: form2Values,
          form3: form3Values,
          selectedCausal,
          pendingCausal,
          otraCausal,
          observaciones,
          adjuntos,
          selectedEmpresa,
          materials,
          costoNoAplica,
        };
        window.localStorage.setItem(ACTA_DRAFT_STORAGE_KEY, JSON.stringify(payload));
      } catch {
        // Ignorar errores de almacenamiento local
      }
    };

    persistDraft();

    return () => {
      const path = window.location.pathname;
      if (!path.startsWith("/actas/nueva")) {
        window.localStorage.removeItem(ACTA_DRAFT_STORAGE_KEY);
      }
    };
  }, [currentStep, maxStepReached, form1Values, form2Values, form3Values, selectedCausal, pendingCausal, otraCausal, observaciones, adjuntos, selectedEmpresa, materials, costoNoAplica]);

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
    form1.setValue("cecoId", ceco.id, { shouldDirty: true });
    setShowCecoModal(false);
    setCecoSearch("");
  };

  const filteredInvima = invimaProducts.filter((p) =>
    INVIMA_CLASSIFICATIONS.has(getMaterialClassification(p)) &&
    (!p.empresa || p.empresa === empresaWatch) &&
    isControlledMaterial(p) === form2.watch("sustanciaControlada") &&
    [p.productName, p.registryNumber, p.codigo || ""].some((value) => value.toLowerCase().includes(invimaSearch.toLowerCase()))
  );

  const selectInvima = async (product: InvimaProduct) => {
    const controlled = isControlledMaterial(product);
    form2.setValue("sustanciaControlada", controlled, { shouldValidate: true, shouldDirty: true });
    form2.setValue("invimaProductId", product.id);
    form2.setValue("registroINVIMA", product.registryNumber);
    form2.setValue("tipoMaterial", getMaterialTypeCode(product), { shouldDirty: true });
    if (product.codigo) form2.setValue("codigoSAP", product.codigo, { shouldValidate: true });
    form2.setValue("descripcion", product.productName);
    const masterType = (product.clase || "").toUpperCase();
    const classification = masterType.includes("ROH") || masterType.includes("MP") ? "MP"
      : masterType.includes("FERT") || masterType.includes("PT") ? "PT"
      : masterType.includes("HALB") || masterType.includes("ST") ? "ST"
      : masterType.includes("UNBW") ? "reactivos"
      : masterType === "ME" ? "ME" : undefined;
    if (classification) form2.setValue("clasificacion", classification as Step2Data["clasificacion"], { shouldValidate: true, shouldDirty: true });
    setInvimaSearch(product.registryNumber);
    setShowInvimaDropdown(false);
    setShowInvimaModal(false);
    setSapCodes([product]);
    form2.setValue("sapCodeId", undefined, { shouldDirty: true });
  };

  const filteredSapCodes = sapCodes.filter((sap) => {
    const query = sapSearch.toLowerCase().trim();
    return isControlledMaterial(sap) === form2.watch("sustanciaControlada") && (!query || [sap.codigo, sap.productName, sap.presentacion || ""].some((value) => (value || "").toLowerCase().includes(query)));
  });

  const selectedMasterMaterial = invimaProducts.find((product) =>
    product.id === form2.watch("invimaProductId") ||
    [product.codigo, product.codigoMaterial].some((code) =>
      code?.trim().toLowerCase() === form2.watch("codigoSAP")?.trim().toLowerCase()
    )
  );
  const masterUnitPrice = selectedMasterMaterial?.precioEstandar;
  const hasMasterUnitPrice = masterUnitPrice != null && Number.isFinite(Number(masterUnitPrice));

  useEffect(() => {
    if (!selectedMasterMaterial) return;
    form3.setValue("costoDestruccion", hasMasterUnitPrice ? Number(masterUnitPrice) : 0, { shouldValidate: true, shouldDirty: true });
    setCostoNoAplica(false);
  }, [form3, hasMasterUnitPrice, masterUnitPrice, selectedMasterMaterial]);

  const invimaNotApplicable = form2.watch("registroINVIMA") === "N/A";
  const sapNotApplicable = form2.watch("codigoSAP") === "N/A";
  const masterType = (selectedMasterMaterial?.clase || "").toUpperCase();
  const classificationLocked = !sapNotApplicable && !!selectedMasterMaterial && (masterType.includes("ROH") || masterType === "MP" || masterType.includes("FERT") || masterType === "PT" || masterType.includes("HALB") || masterType === "ST" || masterType.includes("UNBW") || masterType === "ME");
  const selectedMaterialType = selectedMasterMaterial ? getMaterialTypeCode(selectedMasterMaterial) : "";

  const setInvimaNotApplicable = () => {
    form2.setValue("registroINVIMA", "N/A", { shouldValidate: true, shouldDirty: true });
    form2.setValue("invimaProductId", undefined, { shouldDirty: true });
    setInvimaSearch("N/A");
  };

  const setSapNotApplicable = () => {
    form2.setValue("codigoSAP", "N/A", { shouldValidate: true, shouldDirty: true });
    form2.setValue("sapCodeId", undefined, { shouldDirty: true });
    form2.setValue("invimaProductId", undefined, { shouldDirty: true });
    form2.setValue("descripcion", "", { shouldDirty: true });
  };

  const selectSap = (sap: InvimaProduct) => {
    const controlled = isControlledMaterial(sap);
    form2.setValue("sustanciaControlada", controlled, { shouldValidate: true, shouldDirty: true });
    form2.setValue("codigoSAP", sap.codigo, { shouldValidate: true });
    form2.setValue("invimaProductId", sap.id);
    form2.setValue("registroINVIMA", sap.registryNumber || "N/A");
    form2.setValue("tipoMaterial", getMaterialTypeCode(sap), { shouldDirty: true });
    form2.setValue("descripcion", sap.productName);
    {
      const masterType = (sap.clase || "").toUpperCase();
      const classification = masterType.includes("ROH") || masterType.includes("MP") ? "MP"
        : masterType.includes("FERT") || masterType.includes("PT") ? "PT"
        : masterType.includes("HALB") || masterType.includes("ST") ? "ST"
        : masterType.includes("UNBW") ? "reactivos"
        : masterType === "ME" ? "ME" : undefined;
      if (classification) form2.setValue("clasificacion", classification as Step2Data["clasificacion"], { shouldValidate: true, shouldDirty: true });
    }
    setShowSapModal(false);
  };

  const autoSelectMaterial = (value: string) => {
    const query = value.trim().toLowerCase();
    if (!query) return;
    const material = invimaProducts.find((product) =>
      (!product.empresa || product.empresa === empresaWatch) &&
      isControlledMaterial(product) === form2.getValues("sustanciaControlada") &&
      [product.productName, product.codigo || "", product.registryNumber].some((candidate) => candidate.trim().toLowerCase() === query)
    );
    if (material) void selectInvima(material);
  };

  const onStep1 = form1.handleSubmit((data) => {
    setFormData((prev) => ({ ...prev, ...data }));
    setSelectedEmpresa(data.empresa);
    setCompletedSteps((prev) => [...new Set([...prev, 0])]);
    setCurrentStep(1);
  });

  const onClassification = () => {
    const controlled = form2.getValues("sustanciaControlada");
    if (controlled !== true && controlled !== false) {
      toast.error("Seleccione si el material es controlado o no controlado");
      return;
    }
    setFormData((prev) => ({ ...prev, sustanciaControlada: controlled }));
    setCompletedSteps((prev) => [...new Set([...prev, 1])]);
    setCurrentStep(2);
  };

  const onStep2 = form2.handleSubmit((data) => {
    setFormData((prev) => ({ ...prev, ...data }));
    setCompletedSteps((prev) => [...new Set([...prev, 2])]);
    setCurrentStep(3);
  });

  const hasCompleteMaterial = (currentMaterial: Partial<Step2Data>) => Boolean(
      String(currentMaterial.descripcion || "").trim() &&
      String(currentMaterial.codigoSAP || "").trim() &&
      String(currentMaterial.numeroLote || "").trim() &&
      String(currentMaterial.ordenProduccion || "").trim() &&
      String(currentMaterial.fechaVencimiento || "").trim() &&
      String(currentMaterial.registroINVIMA || "").trim() &&
      currentMaterial.clasificacion &&
      (currentMaterial.sustanciaControlada === true || currentMaterial.sustanciaControlada === false)
    );

  const continueFromMaterialStep = () => {
    setMaterialNotice("");
    const currentMaterial = form2.getValues();
    if (!hasCompleteMaterial(currentMaterial)) {
      if (materials.length > 0) {
        setFormData((previous) => ({ ...previous, ...materials[0] }));
        setCurrentStep(4);
        return;
      }
      setMaterialNotice(materials.length > 0
        ? "Finalice el producto actual o déjelo vacío para continuar con los productos ya agregados."
        : "Complete la información del material antes de continuar.");
      return;
    }
    setFormData((previous) => ({ ...previous, ...currentMaterial }));
    setCurrentStep(3);
  };

  const continueWithSavedProducts = () => {
    if (materials.length === 0) return;
    form2.clearErrors();
    setFormData((prev) => ({ ...prev, ...materials[0] }));
    setCompletedSteps((prev) => [...new Set([...prev, 2])]);
    setShowMoreProductsModal(false);
    setCurrentStep(3);
  };

  const handleAddProduct = () => {
    if (materials.length > 0 && !hasCompleteMaterial(form2.getValues())) {
      setMaterialNotice("El formulario está listo para agregar otro producto. Diligencie sus datos y pulse este botón.");
      return;
    }
    continueFromMaterialStep();
  };

  function materialFromData(data: Step2Data, economicData?: Step3Data): ActaMaterial {
    return {
      descripcion: data.descripcion,
      tipoMaterial: data.tipoMaterial,
      codigoSAP: data.codigoSAP,
      numeroLote: data.numeroLote,
      ordenProduccion: data.ordenProduccion,
      sustanciaControlada: data.sustanciaControlada,
      clasificacion: normalizeClassification(data.clasificacion) as Step2Data["clasificacion"],
      fechaVencimiento: data.fechaVencimiento,
      registroINVIMA: data.registroINVIMA,
      estadoInvima: data.estadoInvima,
      invimaProductId: data.invimaProductId,
      sapCodeId: data.sapCodeId,
      pesoKg: economicData?.pesoKg,
      cantidadUnidades: economicData?.cantidadUnidades,
      costoUnitario: economicData?.costoDestruccion,
      costoTotal: economicData ? Number(economicData.cantidadUnidades) * Number(economicData.costoDestruccion) : undefined,
    };
  }

  function materialsForSave(current: Partial<Step2Data>) {
    if (!String(current.descripcion || "").trim()) return materials;

    const currentMaterial = materialFromData(current as Step2Data);
    const isAlreadyAdded = materials.some((material) =>
      material.descripcion === currentMaterial.descripcion &&
      material.codigoSAP === currentMaterial.codigoSAP &&
      material.numeroLote === currentMaterial.numeroLote &&
      material.ordenProduccion === currentMaterial.ordenProduccion
    );

    return isAlreadyAdded ? materials : [...materials, currentMaterial];
  }

  const addMaterial = (data: Step2Data, economicData: Step3Data) => {
    const newMaterial = materialFromData(data, economicData);
    setMaterials((current) => {
      const next = editingMaterialIndex == null
        ? [...current, newMaterial]
        : current.map((material, index) => index === editingMaterialIndex ? newMaterial : material);
      setMaterialPage(editingMaterialIndex == null ? Math.max(next.length - 1, 0) : editingMaterialIndex);
      return next;
    });
    setEditingMaterialIndex(null);
    setFormData((previous) => ({
      ...previous,
      ...data,
      pesoKg: economicData.pesoKg,
      cantidadUnidades: economicData.cantidadUnidades,
      costoDestruccion: economicData.costoDestruccion,
    }));
    form2.reset({
      descripcion: "",
      codigoSAP: "",
      numeroLote: "",
      ordenProduccion: "",
      sustanciaControlada: data.sustanciaControlada,
      clasificacion: undefined,
      fechaVencimiento: "",
      registroINVIMA: "",
      estadoInvima: "N/A",
      tipoMaterial: "",
      invimaProductId: undefined,
      sapCodeId: undefined,
    });
    form3.reset({ pesoKg: 0, cantidadUnidades: 0, costoDestruccion: 0 });
    setCostoNoAplica(false);
    setInvimaSearch("");
    setSapCodes([]);
    setMaterialNotice("Producto finalizado y agregado. Puede agregar otro producto o continuar.");
    setCurrentStep(2);
  };

  const editMaterial = (index: number) => {
    const material = materials[index];
    if (!material) return;
    setEditingMaterialIndex(index);
    form2.reset({
      descripcion: material.descripcion,
      codigoSAP: material.codigoSAP,
      numeroLote: material.numeroLote,
      ordenProduccion: material.ordenProduccion,
      sustanciaControlada: material.sustanciaControlada,
      clasificacion: normalizeClassification(material.clasificacion) as Step2Data["clasificacion"],
      fechaVencimiento: material.fechaVencimiento?.slice(0, 10) || "",
      registroINVIMA: material.registroINVIMA,
      estadoInvima: material.estadoInvima || "N/A",
      tipoMaterial: material.tipoMaterial,
      invimaProductId: material.invimaProductId,
      sapCodeId: material.sapCodeId,
    });
    form3.reset({
      pesoKg: material.pesoKg ?? 0,
      cantidadUnidades: material.cantidadUnidades ?? 0,
      costoDestruccion: material.costoUnitario ?? 0,
    });
    setCostoNoAplica(Number(material.costoUnitario || 0) === 0);
    setMaterialPage(index);
    setCurrentStep(2);
    setMaterialNotice("Está editando este producto. Finalícelo para guardar los cambios.");
    requestAnimationFrame(() => {
      const firstMaterialField = document.getElementById("material-registro-invima");
      firstMaterialField?.scrollIntoView({ behavior: "smooth", block: "center" });
      (firstMaterialField as HTMLInputElement | null)?.focus();
    });
  };

  const finalizeCurrentMaterial = (economicData: Step3Data) => {
    const currentMaterial = form2.getValues();
    addMaterial(currentMaterial as Step2Data, economicData);
  };

  const onStep3 = form3.handleSubmit((data) => {
    finalizeCurrentMaterial(data);
    setCompletedSteps((prev) => [...new Set([...prev, 2, 3])]);
  });

  const onCausalConfirm = () => {
    if (!pendingCausal) return;
    if (pendingCausal === "otras" && !otraCausal.trim()) {
      toast.error("Debe especificar la otra causal");
      return;
    }
    setSelectedCausal(pendingCausal);
    setCompletedSteps((prev) => [...new Set([...prev, 4])]);
    setShowCausalModal(false);
  };

  const handleSaveDraft = async () => {
    if (!user || !selectedCausal) return;
    try {
      const data = { ...formData } as any;
      const materialItems = materialsForSave(data as Step2Data);
      const economicTotals = materialItems.reduce((totals, material) => ({
        pesoKg: totals.pesoKg + Number(material.pesoKg || 0),
        cantidadUnidades: totals.cantidadUnidades + Number(material.cantidadUnidades || 0),
        costoDestruccion: totals.costoDestruccion + Number(material.costoTotal ?? (Number(material.cantidadUnidades || 0) * Number(material.costoUnitario || 0))),
      }), { pesoKg: 0, cantidadUnidades: 0, costoDestruccion: 0 });
      if (editingActa) {
        await updateActa(editingActa.id, {
          descripcion: data.descripcion || "",
          tipoMaterial: data.tipoMaterial || "",
          codigoSAP: data.codigoSAP || "",
          numeroLote: data.numeroLote || "",
          ordenProduccion: data.ordenProduccion || "",
          sustanciaControlada: !!data.sustanciaControlada,
          clasificacion: data.clasificacion || "otro",
          fechaVencimiento: data.fechaVencimiento || "",
          registroINVIMA: data.registroINVIMA || "",
          estadoInvima: data.estadoInvima || "N/A",
          invimaProductId: data.invimaProductId,
          sapCodeId: data.sapCodeId,
          ...economicTotals,
          causal: selectedCausal,
          otraCausal: otraCausal || undefined,
          observaciones,
          adjuntos,
          materiales: materialItems,
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
      cecoId: data.cecoId,
      fecha: data.fecha || "",
      solicitanteId: user.id,
      solicitanteNombre: user.nombre,
      responsable: data.responsable || "",
      area: isAreaFixed ? user.area : (data.area || ""),
      descripcion: data.descripcion || "",
      tipoMaterial: data.tipoMaterial || "",
      codigoSAP: data.codigoSAP || "",
      numeroLote: data.numeroLote || "",
      ordenProduccion: data.ordenProduccion || "",
      sustanciaControlada: !!data.sustanciaControlada,
      clasificacion: data.clasificacion || "otro",
      fechaVencimiento: data.fechaVencimiento || "",
      registroINVIMA: data.registroINVIMA || "",
      estadoInvima: data.estadoInvima || "N/A",
      invimaProductId: data.invimaProductId,
      sapCodeId: data.sapCodeId,
      ...economicTotals,
      causal: selectedCausal,
      otraCausal: otraCausal || undefined,
      observaciones,
      adjuntos,
      materiales: materialItems,
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
    setIsSendingApproval(true);
    setSendingConsecutivo(editingActa?.consecutivo || "");
    try {
      const data = { ...formData } as any;
      const materialItems = materialsForSave(data as Step2Data);
      const economicTotals = materialItems.reduce((totals, material) => ({
        pesoKg: totals.pesoKg + Number(material.pesoKg || 0),
        cantidadUnidades: totals.cantidadUnidades + Number(material.cantidadUnidades || 0),
        costoDestruccion: totals.costoDestruccion + Number(material.costoTotal ?? (Number(material.cantidadUnidades || 0) * Number(material.costoUnitario || 0))),
      }), { pesoKg: 0, cantidadUnidades: 0, costoDestruccion: 0 });
      if (editingActa) {
        await updateActa(editingActa.id, {
          descripcion: data.descripcion || "",
          tipoMaterial: data.tipoMaterial || "",
          codigoSAP: data.codigoSAP || "",
          numeroLote: data.numeroLote || "",
          ordenProduccion: data.ordenProduccion || "",
          sustanciaControlada: !!data.sustanciaControlada,
          clasificacion: data.clasificacion || "otro",
          fechaVencimiento: data.fechaVencimiento || "",
          registroINVIMA: data.registroINVIMA || "",
          estadoInvima: data.estadoInvima || "N/A",
          invimaProductId: data.invimaProductId,
          sapCodeId: data.sapCodeId,
          ...economicTotals,
          causal: selectedCausal,
          otraCausal: otraCausal || undefined,
          observaciones,
          adjuntos,
          materiales: materialItems,
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
      cecoId: data.cecoId,
      fecha: data.fecha || "",
      solicitanteId: user.id,
      solicitanteNombre: user.nombre,
      responsable: data.responsable || "",
      area: isAreaFixed ? user.area : (data.area || ""),
      descripcion: data.descripcion || "",
      tipoMaterial: data.tipoMaterial || "",
      codigoSAP: data.codigoSAP || "",
      numeroLote: data.numeroLote || "",
      ordenProduccion: data.ordenProduccion || "",
      sustanciaControlada: !!data.sustanciaControlada,
      clasificacion: data.clasificacion || "otro",
      fechaVencimiento: data.fechaVencimiento || "",
      registroINVIMA: data.registroINVIMA || "",
      estadoInvima: data.estadoInvima || "N/A",
      invimaProductId: data.invimaProductId,
      sapCodeId: data.sapCodeId,
      ...economicTotals,
      causal: selectedCausal,
      otraCausal: otraCausal || undefined,
      observaciones,
      adjuntos,
      materiales: materialItems,
      });
      setSendingConsecutivo(acta.consecutivo);
      await sendActa(acta.id, user.id, user.nombre);
      window.localStorage.removeItem(ACTA_DRAFT_STORAGE_KEY);
      toast.success(`Acta ${acta.consecutivo} enviada a aprobación`);
      navigate(`/actas/${acta.id}`);
    } catch (error) {
      setIsSendingApproval(false);
      setSendingConsecutivo("");
      toast.error(error instanceof Error ? error.message : "No se pudo crear el acta");
    }
  };

  const filled = [
    !!formData.empresa,
    !!formData.clasificacion,
    !!formData.descripcion,
    !!formData.pesoKg,
    !!selectedCausal,
    true,
  ];
  const progress = filled.filter(Boolean).length;
  const summaryMaterial = materialSummary[summaryMaterialPage] ?? materialSummary[0];
  const economicSummary = materialSummary.reduce((totals, material) => ({
    pesoKg: totals.pesoKg + Number(material.pesoKg || 0),
    cantidadUnidades: totals.cantidadUnidades + Number(material.cantidadUnidades || 0),
    costoTotal: totals.costoTotal + Number(material.costoTotal ?? (Number(material.cantidadUnidades || 0) * Number(material.costoUnitario || 0))),
  }), { pesoKg: 0, cantidadUnidades: 0, costoTotal: 0 });

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {isSendingApproval && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/45 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-7 text-center shadow-2xl">
            <Loader2 size={34} className="mx-auto animate-spin text-blue-700" />
            <h2 className="mt-4 text-lg font-bold text-slate-900">
              {sendingConsecutivo ? "Acta en proceso de envío" : "Generando el consecutivo del acta"}
            </h2>
            {sendingConsecutivo ? (
              <>
                <p className="mt-2 text-sm text-slate-600">Recuerde este consecutivo para hacer seguimiento a la destrucción:</p>
                <p className="mt-4 rounded-lg bg-blue-50 px-4 py-3 font-mono text-2xl font-bold tracking-wide text-blue-800">{sendingConsecutivo}</p>
                <p className="mt-3 text-xs font-medium text-slate-500">Puede tomarle una foto mientras terminamos de enviar el acta a aprobación.</p>
              </>
            ) : (
              <p className="mt-2 text-sm text-slate-600">Estamos preparando el acta. En unos segundos aparecerá su consecutivo.</p>
            )}
          </div>
        </div>
      )}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">{isEditing ? "Editar Acta de Destrucción" : form2.watch("sustanciaControlada") === true ? "Acta para producto controlado" : form2.watch("sustanciaControlada") === false ? "Acta para producto no controlado" : "Nueva Acta de Destrucción"}</h1>
          <p className="text-sm text-slate-500 mt-0.5">{isEditing ? "La información general está bloqueada; edite desde la información del material." : "Complete todos los pasos para crear el acta"}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-5">
        <ProgressBar value={progress} max={6} label="Progreso del formulario" />
        <div className="mt-5">
          <Stepper
            steps={STEPS}
            currentStep={currentStep}
            completedSteps={completedSteps}
            maxStepReached={maxStepReached}
            onStepClick={setCurrentStep}
          />
        </div>
      </div>

      {/* Step 1: General Info */}
      {currentStep === 0 && (
        <div id="material-info-start" className="bg-white rounded-xl border border-slate-200 p-6">
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
                <input type="hidden" {...form1.register("cecoId")} />
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

      <Modal open={showInvimaModal} onClose={() => setShowInvimaModal(false)} title={`Buscar código INVIMA · ${empresaWatch}`} size="lg">
        <div className="space-y-4">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input autoFocus value={invimaSearch} onChange={(event) => setInvimaSearch(event.target.value)} placeholder="Buscar código INVIMA o descripción..." className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-xs text-blue-800">Busca aquí el código INVIMA para rellenar automáticamente la información del material. El maestro solo muestra materias primas, materiales de empaque y productos terminados.</div>
          <p className="text-xs text-slate-500">{filteredInvima.length} materiales encontrados por código INVIMA o descripción.</p>
          <div className="max-h-[50vh] overflow-auto border border-slate-200 rounded-lg">
            <table className="min-w-[680px] w-full text-sm">
              <thead className="sticky top-0 bg-slate-50 border-b border-slate-200"><tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">INVIMA</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Código SAP</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Producto</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Presentación</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Controlado</th>
              </tr></thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInvima.map((product) => <tr key={product.id} onClick={() => selectInvima(product)} className="cursor-pointer hover:bg-blue-50">
                  <td className="px-4 py-3 font-mono text-xs font-semibold text-blue-700">{product.registryNumber}</td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-600">{product.codigo || "N/A"}</td>
                  <td className="px-4 py-3 font-medium text-slate-800">{product.productName}</td>
                  <td className="px-4 py-3 text-slate-600">{product.presentacion || "Sin presentación"}</td>
                  <td className="px-4 py-3 text-slate-500">{product.controlado ? "Sí" : "No"}</td>
                </tr>)}
              </tbody>
            </table>
            {filteredInvima.length === 0 && <p className="p-6 text-center text-sm text-slate-500">No hay productos INVIMA vigentes para esta empresa.</p>}
          </div>
        </div>
      </Modal>

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

      <Modal open={showSapModal} onClose={() => setShowSapModal(false)} title={`Buscar código SAP · ${empresaWatch}`} size="lg">
        <div className="space-y-4">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input autoFocus value={sapSearch} onChange={(event) => setSapSearch(event.target.value)} placeholder="Buscar código SAP o descripción..." className="w-full pl-9 pr-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-xs text-blue-800">Busca aquí el código SAP para rellenar automáticamente la información relacionada. Si no está en el sistema, puedes escribirlo manualmente.</div>
          <div className="max-h-[50vh] overflow-auto border border-slate-200 rounded-lg">
            <table className="min-w-[620px] w-full text-sm">
              <thead className="sticky top-0 bg-slate-50 border-b border-slate-200"><tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Código SAP</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Descripción</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Presentación</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">Unidad</th>
              </tr></thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSapCodes.map((sap) => <tr key={sap.id} onClick={() => selectSap(sap)} className="cursor-pointer hover:bg-blue-50">
                  <td className="px-4 py-3 font-mono text-xs font-semibold text-blue-700">{sap.codigo}</td>
                  <td className="px-4 py-3 text-slate-800">{sap.productName}</td>
                  <td className="px-4 py-3 text-slate-600">{sap.presentacion || "—"}</td>
                  <td className="px-4 py-3 text-xs text-slate-500">{sap.unidadMedidaBase || "—"}</td>
                </tr>)}
              </tbody>
            </table>
            {filteredSapCodes.length === 0 && <p className="p-6 text-center text-sm text-slate-500">No hay códigos SAP relacionados.</p>}
          </div>
        </div>
      </Modal>

      <Modal open={showMaterialTypeModal} onClose={() => setShowMaterialTypeModal(false)} title="Tipos de material SAP" size="md">
        <div className="space-y-3">
          <p className="text-sm text-slate-600">Estos códigos identifican la naturaleza del material. Seleccione el que corresponda cuando el código SAP sea “No aplica”.</p>
          <div className="divide-y divide-slate-100 rounded-lg border border-slate-200">
            {MATERIAL_TYPE_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  if (sapNotApplicable) form2.setValue("tipoMaterial", option.value, { shouldDirty: true });
                  setShowMaterialTypeModal(false);
                }}
                className="block w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors"
              >
                <span className="block text-sm font-semibold text-slate-800">{option.label}</span>
                <span className="mt-1 block text-xs leading-relaxed text-slate-500">{option.meaning}</span>
              </button>
            ))}
          </div>
        </div>
      </Modal>

      <Modal open={showMoreProductsModal} onClose={() => setShowMoreProductsModal(false)} title="Agregar más productos" size="sm">
        <div className="space-y-4">
          <p className="text-sm leading-relaxed text-slate-600">¿Desea agregar más productos al acta?</p>
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => setShowMoreProductsModal(false)}
              className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Sí, agregar más
            </button>
            <button
              type="button"
              onClick={continueWithSavedProducts}
              className="rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-800"
            >
              No, continuar
            </button>
          </div>
        </div>
      </Modal>

      <Modal open={showMaterialWarningModal} onClose={() => setShowMaterialWarningModal(false)} title="Información del material incompleta" size="sm">
        <div className="space-y-4">
          <p className="text-sm leading-relaxed text-slate-600">Debe agregar mínimo un producto a la tabla o completar toda la información del material antes de continuar.</p>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setShowMaterialWarningModal(false)}
              className="rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-800"
            >
              Cerrar
            </button>
          </div>
        </div>
      </Modal>

      {/* Step 2: Control condition */}
      {currentStep === 1 && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-base font-semibold text-slate-800 mb-2">Paso 2 — Condición de control del acta de destrucción</h2>
          <p className="text-sm text-slate-500 mb-5">Seleccione si el material es controlado o no controlado por el FNE u otras autoridades como MinJusticia o Policía Nacional.</p>
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Condición de control *</label>
              <div className="grid grid-cols-2 gap-3">
                {[true, false].map((controlled) => (
                  <label key={String(controlled)} className={`flex items-center justify-center gap-2 rounded-lg border px-4 py-3 text-sm font-semibold cursor-pointer transition-all ${form2.watch("sustanciaControlada") === controlled ? "border-blue-500 bg-blue-50 text-blue-700 ring-1 ring-blue-200" : "border-slate-300 bg-white text-slate-700 hover:border-blue-300"}`}>
                    <input type="radio" checked={form2.watch("sustanciaControlada") === controlled} onChange={() => form2.setValue("sustanciaControlada", controlled, { shouldValidate: true, shouldDirty: true })} className="h-4 w-4 accent-blue-600" />
                    {controlled ? "Controlada" : "No controlada"}
                  </label>
                ))}
              </div>
            </div>
          </div>
          <div className="flex justify-between pt-6">
            <button type="button" onClick={() => setCurrentStep(0)} className="h-11 min-w-[140px] px-4 py-2.5 text-sm text-slate-700 font-medium bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">← Anterior</button>
            <button type="button" onClick={onClassification} className="h-11 min-w-[140px] px-5 py-2.5 rounded-lg text-sm font-medium bg-blue-700 text-white hover:bg-blue-800 transition-colors">Siguiente →</button>
          </div>
        </div>
      )}

      {/* Step 3: Material Info */}
      {currentStep === 2 && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-base font-semibold text-slate-800 mb-5">Paso 3 — Información del Material</h2>
          <form onSubmit={(event) => { event.preventDefault(); continueFromMaterialStep(); }} noValidate className="space-y-4">
            {materialNotice && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm text-amber-800" role="status">
                {materialNotice}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Código INVIMA *</label>
              <div className="flex flex-col gap-2 sm:flex-row">
                <input id="material-registro-invima" {...form2.register("registroINVIMA", { onBlur: (event) => autoSelectMaterial(event.target.value) })} placeholder="Código INVIMA o N/A" className="min-w-0 flex-1 px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <div className="flex gap-2">
                  <button type="button" onClick={() => setShowInvimaModal(true)} className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 hover:border-blue-500 hover:text-blue-700 sm:flex-none" title="Buscar información en el maestro"><Search size={16} /> Buscar</button>
                  <button type="button" onClick={setInvimaNotApplicable} className={`flex-1 rounded-lg border px-3 py-2.5 text-sm font-medium sm:flex-none ${invimaNotApplicable ? "border-amber-500 bg-amber-50 text-amber-800" : "border-slate-300 bg-white text-slate-700 hover:border-amber-500 hover:text-amber-700"}`}>No aplica</button>
                </div>
              </div>
              <FieldError message={form2.formState.errors.registroINVIMA?.message} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Descripción del material *</label>
                <input {...form2.register("descripcion", { onBlur: (event) => autoSelectMaterial(event.target.value) })} placeholder="Nombre, concentración y presentación" className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <FieldError message={form2.formState.errors.descripcion?.message} />
              </div>
              <div className="order-first">
                <label className="block text-sm font-medium text-slate-700 mb-1">Código SAP *</label>
                <input type="hidden" {...form2.register("invimaProductId")} />
                <input type="hidden" {...form2.register("sapCodeId")} />
                <div className="flex flex-col gap-2 sm:flex-row">
                  <input {...form2.register("codigoSAP", { onBlur: (event) => autoSelectMaterial(event.target.value) })} placeholder="Ingrese únicamente el código SAP" className="min-w-0 flex-1 px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <div className="flex gap-2">
                    <button type="button" onClick={() => { setSapCodes(invimaProducts.filter((product) => (!product.empresa || product.empresa === empresaWatch) && isControlledMaterial(product) === form2.watch("sustanciaControlada"))); setShowSapModal(true); }} className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 hover:border-blue-500 hover:text-blue-700 sm:flex-none" title="Buscar cualquier código SAP del maestro unificado"><Search size={16} /> Buscar</button>
                    <button type="button" onClick={setSapNotApplicable} className={`flex-1 rounded-lg border px-3 py-2.5 text-sm font-medium sm:flex-none ${sapNotApplicable ? "border-amber-500 bg-amber-50 text-amber-800" : "border-slate-300 bg-white text-slate-700 hover:border-amber-500 hover:text-amber-700"}`}>No aplica</button>
                  </div>
                </div>
                <FieldError message={form2.formState.errors.codigoSAP?.message} />
              </div>
              <div className="order-first">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <label htmlFor="tipo-material" className="block text-sm font-medium text-slate-700">Tipo de material</label>
                  <button type="button" onClick={() => setShowMaterialTypeModal(true)} className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 hover:text-blue-900" title="Ver significado de los tipos de material">
                    <Info size={14} /> Ver significados
                  </button>
                </div>
                <select
                  id="tipo-material"
                  {...form2.register("tipoMaterial")}
                  value={sapNotApplicable ? form2.watch("tipoMaterial") || "" : selectedMaterialType}
                  onChange={(event) => form2.setValue("tipoMaterial", event.target.value, { shouldDirty: true })}
                  disabled={!sapNotApplicable}
                  aria-label="Tipo de material asociado al código SAP"
                  className={`w-full px-3 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${sapNotApplicable ? "border-slate-300 bg-white text-slate-700" : "border-slate-200 bg-slate-50 text-slate-700 cursor-default"}`}
                >
                  <option value="">{sapNotApplicable ? "Seleccione el tipo de material" : "Sin tipo asociado"}</option>
                  {selectedMaterialType && !MATERIAL_TYPE_OPTIONS.some((option) => option.value === selectedMaterialType) && (
                    <option value={selectedMaterialType}>{selectedMaterialType} = Tipo SAP</option>
                  )}
                  {MATERIAL_TYPE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
                <p className="mt-1 text-xs text-slate-500">{sapNotApplicable ? "Seleccione el código que corresponda al material." : "Se completa automáticamente al seleccionar un código SAP del maestro."}</p>
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
            </div>
            <div>
              <div className="mb-2 flex items-center justify-between gap-3">
                <label className="block text-sm font-medium text-slate-700">Clasificación del material *</label>
                <span className="text-xs text-slate-500">{classificationLocked ? "Asignada automáticamente desde el maestro." : "Seleccione manualmente si el maestro no la define."}</span>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {MATERIAL_CLASSIFICATIONS.map((option) => (
                  <label key={option.value} className={`flex items-start gap-3 rounded-lg border p-3 transition-all ${classificationLocked ? "cursor-not-allowed opacity-70" : "cursor-pointer"} ${form2.watch("clasificacion") === option.value ? "border-blue-500 bg-blue-50 text-blue-700 ring-1 ring-blue-200" : "border-slate-200 bg-white hover:border-blue-300"}`}>
                    <input {...form2.register("clasificacion")} type="radio" value={option.value} disabled={classificationLocked} className="mt-0.5 h-4 w-4 shrink-0 accent-blue-600 disabled:cursor-not-allowed" />
                    <span><span className="block text-sm font-semibold">{option.label}</span><span className="mt-0.5 block text-xs text-slate-500">{option.detail}</span></span>
                  </label>
                ))}
              </div>
              <FieldError message={form2.formState.errors.clasificacion?.message} />
            </div>
            <div className="flex justify-between pt-2">
              <button type="button" onClick={() => setCurrentStep(1)} className="h-11 min-w-[140px] px-4 py-2.5 text-sm text-slate-700 font-medium bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">← Anterior</button>
              <div className="flex flex-col-reverse gap-2 sm:flex-row">
                <button type="button" onClick={handleAddProduct} className="h-11 px-4 py-2.5 rounded-lg text-sm font-medium border border-blue-300 text-blue-700 hover:bg-blue-50 transition-colors">+ {materials.length === 0 ? "Agregar producto" : "Agregar otro"}</button>
                <button type="button" onClick={continueFromMaterialStep} className="h-11 min-w-[140px] px-5 py-2.5 rounded-lg text-sm font-medium bg-blue-700 text-white hover:bg-blue-800 transition-colors">Siguiente →</button>
              </div>
            </div>
          </form>
          <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-slate-700">Productos agregados</h3>
              <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-700">{materials.length}</span>
            </div>

            {materials.length === 0 ? (
              <div className="mt-3 rounded-lg border border-slate-200 bg-white px-3 py-5 text-center text-xs text-slate-500">
                Complete un producto y pulse “Siguiente” para ingresar su información económica.
              </div>
            ) : (
              <div className="mt-3 rounded-lg border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between gap-3 pb-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Material</p>
                    <p className="text-sm font-semibold text-slate-800">{materialPage + 1} de {materials.length}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setMaterialPage((current) => Math.max(current - 1, 0))}
                      disabled={materialPage === 0}
                      className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-40 hover:bg-slate-50"
                    >
                      Anterior
                    </button>
                    <button
                      type="button"
                      onClick={() => setMaterialPage((current) => Math.min(current + 1, materials.length - 1))}
                      disabled={materialPage === materials.length - 1}
                      className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-40 hover:bg-slate-50"
                    >
                      Siguiente
                    </button>
                  </div>
                </div>

                {(() => {
                  const material = materials[materialPage];
                  if (!material) return null;
                  return (
                    <div className="space-y-4">
                      <div className="rounded-lg border border-blue-100 bg-blue-50 p-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-blue-700">Descripción</p>
                        <p className="mt-1 text-base font-semibold text-slate-900">{material.descripcion}</p>
                      </div>

                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">Código SAP</p>
                          <p className="mt-1 font-mono text-sm font-semibold text-slate-800">{material.codigoSAP}</p>
                        </div>
                        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">INVIMA</p>
                          <p className="mt-1 font-mono text-sm font-semibold text-slate-800">{material.registroINVIMA}</p>
                        </div>
                        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">Tipo</p>
                          <p className="mt-1 text-sm font-medium text-slate-800">{material.tipoMaterial || "N/A"}</p>
                        </div>
                        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">Clasificación</p>
                          <p className="mt-1 text-sm font-medium text-slate-800">{CLASIFICACION_LABELS[material.clasificacion] || material.clasificacion}</p>
                        </div>
                        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">Lote</p>
                          <p className="mt-1 text-sm font-medium text-slate-800">{material.numeroLote}</p>
                        </div>
                        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">Orden producción</p>
                          <p className="mt-1 text-sm font-medium text-slate-800">{material.ordenProduccion}</p>
                        </div>
                        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">Vencimiento</p>
                          <p className="mt-1 text-sm font-medium text-slate-800">{material.fechaVencimiento}</p>
                        </div>
                        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">Controlado</p>
                          <p className="mt-1 text-sm font-medium text-slate-800">{material.sustanciaControlada ? "Sí" : "No"}</p>
                        </div>
                        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">Unidades</p>
                          <p className="mt-1 text-sm font-medium text-slate-800">{material.cantidadUnidades ?? "—"}</p>
                        </div>
                        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">Precio unitario</p>
                          <p className="mt-1 text-sm font-medium text-slate-800">{material.costoUnitario == null ? "—" : `COP ${Number(material.costoUnitario).toLocaleString("es-CO")}`}</p>
                        </div>
                        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 sm:col-span-2 xl:col-span-2">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">Total</p>
                          <p className="mt-1 text-sm font-semibold text-slate-900">{material.costoTotal == null ? "—" : `COP ${Number(material.costoTotal).toLocaleString("es-CO")}`}</p>
                        </div>
                      </div>

                      <div className="flex justify-end">
                        <div className="flex items-center gap-3">
                          <button type="button" onClick={() => editMaterial(materialPage)} className="text-sm font-medium text-blue-700 hover:text-blue-900">
                            Editar producto
                          </button>
                          <button
                            type="button"
                            onClick={() => setRemoveMaterialIndex(materialPage)}
                            className="text-sm font-medium text-red-600 hover:text-red-800"
                          >
                            Quitar material
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        </div>
      )}

      <ConfirmModal
        open={removeMaterialIndex !== null}
        onClose={() => setRemoveMaterialIndex(null)}
        onConfirm={() => {
          if (removeMaterialIndex === null) return;
          setMaterials((current) => {
            const next = current.filter((_, materialIndex) => materialIndex !== removeMaterialIndex);
            setMaterialPage((previous) => Math.min(previous, Math.max(next.length - 1, 0)));
            return next;
          });
          setRemoveMaterialIndex(null);
        }}
        title="Quitar material"
        message="¿Está seguro de que desea quitar este material?"
        confirmLabel="Quitar"
        danger
      />

      {/* Step 3: Economic Info */}
      {currentStep === 3 && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-base font-semibold text-slate-800 mb-2">Información económica del producto</h2>
          <p className="mb-5 text-sm text-slate-500">Producto: <span className="font-semibold text-slate-700">{form2.watch("descripcion") || "Sin descripción"}</span></p>
          <form onSubmit={onStep3} noValidate className="space-y-4">
            <div className="grid grid-cols-1 items-start gap-4 sm:grid-cols-3">
              <div className="flex min-w-0 flex-col">
                <label className="mb-1 flex h-10 items-start text-sm font-medium leading-tight text-slate-700">Peso (kg) *</label>
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
              <div className="flex min-w-0 flex-col">
                <label className="mb-1 flex h-10 items-start text-sm font-medium leading-tight text-slate-700">Cantidad (unidades) *</label>
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
              <div className="flex min-w-0 flex-col">
                <div className="mb-1 flex h-10 items-start gap-2">
                  <label className="min-w-0 flex-1 text-sm font-medium leading-tight text-slate-700">Precio unitario (COP)</label>
                  {!hasMasterUnitPrice && <button
                      type="button"
                      onClick={() => {
                        const nextValue = !costoNoAplica;
                        setCostoNoAplica(nextValue);
                        form3.setValue("costoDestruccion", nextValue ? 0 : "", { shouldValidate: true, shouldDirty: true });
                      }}
                      className={`w-[104px] shrink-0 rounded-md border px-2 py-1 text-xs font-medium leading-tight transition-colors ${costoNoAplica ? "border-amber-400 bg-amber-50 text-amber-800" : "border-slate-300 bg-white text-slate-600 hover:border-amber-400 hover:text-amber-700"}`}
                    >
                      {costoNoAplica ? "No aplica" : "Marcar no aplica"}
                    </button>}
                </div>
                <input
                  {...form3.register("costoDestruccion")}
                  type="text"
                  inputMode="numeric"
                  maxLength={13}
                  placeholder="0"
                  disabled={costoNoAplica || hasMasterUnitPrice}
                  value={costoNoAplica ? "" : form3.watch("costoDestruccion") || ""}
                  className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
                />
                {hasMasterUnitPrice && <p className="mt-1 text-xs text-blue-700">Precio tomado del maestro de productos.</p>}
                {costoNoAplica && <p className="mt-1 text-xs text-slate-500">Se guardará como “No aplica” y tendrá valor interno 0.</p>}
                <FieldError message={form3.formState.errors.costoDestruccion?.message} />
              </div>
            </div>
            <div className="rounded-lg border border-blue-100 bg-blue-50 px-4 py-3">
              <div className="flex items-center justify-between gap-4">
                <span className="text-sm font-medium text-blue-900">Total del material a destruir</span>
                <span className="text-lg font-bold text-blue-900">
                  {costoNoAplica ? "No aplica" : `COP ${(Number(form3.watch("cantidadUnidades") || 0) * Number(form3.watch("costoDestruccion") || 0)).toLocaleString("es-CO")}`}
                </span>
              </div>
              <p className="mt-1 text-xs text-blue-700">Cantidad × precio unitario</p>
            </div>
            <div className="flex justify-between pt-2">
              <button type="button" onClick={() => setCurrentStep(2)} className="h-11 min-w-[140px] px-4 py-2.5 text-sm text-slate-700 font-medium bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">← Volver al material</button>
              <button type="submit" className="h-11 min-w-[190px] px-5 py-2.5 rounded-lg text-sm font-medium bg-blue-700 text-white hover:bg-blue-800 transition-colors">Finalizar producto</button>
            </div>
          </form>
        </div>
      )}

      {/* Step 4: Causal */}
      {currentStep === 4 && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-base font-semibold text-slate-800 mb-2">Paso 5 — Causal de Destrucción</h2>
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
            <button onClick={() => setCurrentStep(3)} className="h-11 min-w-[140px] px-4 py-2.5 text-sm text-slate-700 font-medium bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">← Anterior</button>
            <button
              onClick={() => { if (selectedCausal) { setCompletedSteps((p) => [...new Set([...p, 4])]); setCurrentStep(5); } else toast.error("Seleccione al menos una causal"); }}
              className="h-11 min-w-[140px] px-5 py-2.5 rounded-lg text-sm font-medium bg-blue-700 text-white hover:bg-blue-800 transition-colors"
            >
              Siguiente →
            </button>
          </div>
        </div>
      )}

      {/* Step 5: Observations */}
      {currentStep === 5 && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-base font-semibold text-slate-800 mb-5">Paso 6 — Observaciones y Adjuntos</h2>
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
            <button onClick={() => setCurrentStep(4)} className="h-11 min-w-[140px] px-4 py-2.5 text-sm text-slate-700 font-medium bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">← Anterior</button>
            <button
              onClick={() => { setCompletedSteps((p) => [...new Set([...p, 5])]); setCurrentStep(6); }}
              className="h-11 min-w-[140px] px-5 py-2.5 rounded-lg text-sm font-medium bg-blue-700 text-white hover:bg-blue-800 transition-colors"
            >
              Ver Resumen →
            </button>
          </div>
        </div>
      )}

      {/* Step 6: Summary */}
      {currentStep === 6 && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-base font-semibold text-slate-800 mb-5">Paso 7 — Resumen del Acta</h2>
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
              {materialSummary.length === 0 ? (
                <div className="py-2 text-sm text-slate-500">No hay materiales agregados aún.</div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2 pb-1">
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Producto {summaryMaterialPage + 1} de {materialSummary.length}</p>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setSummaryMaterialPage((current) => Math.max(current - 1, 0))}
                        disabled={summaryMaterialPage === 0}
                        className="rounded-md border border-slate-300 px-2 py-1 text-[11px] font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-40 hover:bg-slate-50"
                      >
                        Anterior
                      </button>
                      <button
                        type="button"
                        onClick={() => setSummaryMaterialPage((current) => Math.min(current + 1, materialSummary.length - 1))}
                        disabled={summaryMaterialPage === materialSummary.length - 1}
                        className="rounded-md border border-slate-300 px-2 py-1 text-[11px] font-medium text-slate-700 disabled:cursor-not-allowed disabled:opacity-40 hover:bg-slate-50"
                      >
                        Siguiente
                      </button>
                    </div>
                  </div>

                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <p className="mb-2 text-sm font-semibold text-slate-800">{summaryMaterial.descripcion}</p>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      <Row label="Código SAP" value={summaryMaterial.codigoSAP} />
                      <Row label="Tipo de material" value={summaryMaterial.tipoMaterial || "No especificado"} />
                      <Row label="Clasificación" value={CLASIFICACION_LABELS[summaryMaterial.clasificacion]} />
                      <Row label="Registro INVIMA" value={summaryMaterial.registroINVIMA} />
                      <Row label="Número de Lote" value={summaryMaterial.numeroLote} />
                      <Row label="Orden de Producción" value={summaryMaterial.ordenProduccion} />
                      <Row label="Fecha Vencimiento" value={summaryMaterial.fechaVencimiento} />
                      <Row label="Sustancia Controlada" value={summaryMaterial.sustanciaControlada ? "Sí" : "No"} />
                      <Row label="Peso (kg)" value={String(summaryMaterial.pesoKg ?? "—")} />
                      <Row label="Unidades" value={String(summaryMaterial.cantidadUnidades ?? "—")} />
                      <Row label="Precio unitario" value={summaryMaterial.costoUnitario == null ? "—" : `COP ${Number(summaryMaterial.costoUnitario).toLocaleString("es-CO")}`} />
                      <Row label="Total del material" value={summaryMaterial.costoTotal == null ? "—" : `COP ${Number(summaryMaterial.costoTotal).toLocaleString("es-CO")}`} />
                    </div>
                  </div>
                </div>
              )}
            </Section>
            <Section title="Información Económica y de cantidad generada">
              <Row label="Peso total (kg)" value={String(economicSummary.pesoKg || formData.pesoKg || 0)} />
              <Row label="Unidades totales" value={String(economicSummary.cantidadUnidades || formData.cantidadUnidades || 0)} />
              <Row label="Valor total a destruir" value={costoNoAplica ? "No aplica" : `COP ${Number(economicSummary.costoTotal || formData.costoDestruccion || 0).toLocaleString("es-CO")}`} />
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
            <button onClick={() => setCurrentStep(5)} className="h-11 min-w-[140px] px-4 py-2.5 text-sm text-slate-700 font-medium bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors">← Anterior</button>
            <div className="flex gap-3">
              <button onClick={handleSaveDraft} className="h-11 min-w-[140px] px-5 py-2.5 text-sm font-medium border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors">
                Guardar Borrador
              </button>
              <button onClick={handleSendApproval} disabled={isSendingApproval} className="h-11 min-w-[170px] px-5 py-2.5 rounded-lg text-sm font-semibold bg-blue-700 text-white hover:bg-blue-800 transition-colors flex items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-60">
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
      <div className="bg-slate-50 px-3 py-2 border-b border-slate-200">
        <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">{title}</p>
      </div>
      <div className="px-3 py-2.5 divide-y divide-slate-100">{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 py-1">
      <p className="text-[11px] text-slate-500 font-medium w-28 shrink-0">{label}</p>
      <p className="text-xs text-slate-800 flex-1 leading-relaxed">{value || "—"}</p>
    </div>
  );
}
