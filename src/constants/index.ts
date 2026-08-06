import type {
  Role,
  ActaStatus,
  ClasificacionMaterial,
  CausalDestruccion,
  Empresa,
} from "../types";

export const ROLE_LABELS: Record<Role, string> = {
  administrador: "Administrador",
  solicitante: "Solicitante",
  aprobador_area: "Aprobador de Área",
  costos: "Costos",
  hse: "HSE & S",
  planeacion: "Planeación",
};

export const ACTA_STATUS_LABELS: Record<ActaStatus, string> = {
  borrador: "Borrador",
  creada: "Creada",
  enviada: "Enviada",
  pendiente_aprobacion_area: "Pendiente Aprobación Área",
  pendiente_costos: "Pendiente Costos",
  pendiente_hse: "Pendiente HSE",
  devuelta_ajustes: "Devuelta para Ajustes",
  rechazada: "Rechazada",
  aprobada: "Aprobada",
  cerrada: "Cerrada",
};

export const ACTA_STATUS_COLORS: Record<
  ActaStatus,
  { bg: string; text: string; border: string }
> = {
  borrador: {
    bg: "bg-slate-100",
    text: "text-slate-600",
    border: "border-slate-200",
  },
  creada: {
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
  },
  enviada: {
    bg: "bg-indigo-50",
    text: "text-indigo-700",
    border: "border-indigo-200",
  },
  pendiente_aprobacion_area: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
  },
  pendiente_costos: {
    bg: "bg-orange-50",
    text: "text-orange-700",
    border: "border-orange-200",
  },
  pendiente_hse: {
    bg: "bg-purple-50",
    text: "text-purple-700",
    border: "border-purple-200",
  },
  devuelta_ajustes: {
    bg: "bg-yellow-50",
    text: "text-yellow-700",
    border: "border-yellow-200",
  },
  rechazada: {
    bg: "bg-red-50",
    text: "text-red-700",
    border: "border-red-200",
  },
  aprobada: {
    bg: "bg-green-50",
    text: "text-green-700",
    border: "border-green-200",
  },
  cerrada: {
    bg: "bg-slate-50",
    text: "text-slate-500",
    border: "border-slate-200",
  },
};

export const CLASIFICACION_LABELS: Record<ClasificacionMaterial, string> = {
  materia_prima: "Materia Prima",
  producto_semiterminado: "Producto Semiterminado",
  granel: "Granel",
  producto_terminado: "Producto Terminado",
  material_empaque: "Material de Empaque",
  reactivos: "Reactivos",
  remanentes: "Remanentes",
  muestras: "Muestras",
  otro: "Otro",
};

export const CAUSAL_LABELS: Record<CausalDestruccion, string> = {
  material_vencido: "Material Vencido",
  producto_no_conforme: "Producto No Conforme",
  residuos_proceso: "Residuos de Proceso",
  contaminacion: "Contaminación",
  dano_operativo: "Daño Operativo",
  remanentes: "Remanentes",
  producto_retirado: "Producto Retirado",
  otras: "Otras Causales",
};

export const CAUSAL_DESCRIPTIONS: Record<
  CausalDestruccion,
  { description: string; cuando: string; ejemplos: string[] }
> = {
  material_vencido: {
    description:
      "Material o producto que ha superado su fecha de vencimiento o tiempo de almacenamiento/reproceso.",
    cuando:
      "Aplica cuando el material ya superó la fecha de vencimiento indicada en el rotulado o en el sistema.",
    ejemplos: [
      "Materia prima con fecha de vencimiento expirada",
      "Producto terminado con fecha de caducidad superada",
      "Material de empaque con tiempo de almacenamiento vencido",
    ],
  },
  producto_no_conforme: {
    description:
      "Producto que incumple especificaciones de calidad, presenta defectos físicos, visuales, de integridad, rotulado o empaque.",
    cuando:
      "Aplica cuando el producto no cumple los parámetros de calidad definidos en la especificación.",
    ejemplos: [
      "Tabletas con variación de peso fuera de especificación",
      "Ampollas con partículas visibles",
      "Etiquetado incorrecto o ilegible",
    ],
  },
  residuos_proceso: {
    description:
      "Residuos generados durante controles en proceso, ensayos, análisis, validaciones, arranques, ajustes de equipos o desarrollo.",
    cuando: "Aplica para materiales generados como subproducto del proceso productivo o de control.",
    ejemplos: [
      "Muestras de control de proceso",
      "Material sobrante de arranque de línea",
      "Residuos de validación",
    ],
  },
  contaminacion: {
    description:
      "Material con contaminación cruzada, microbiológica, química o mezcla con otra sustancia.",
    cuando: "Aplica cuando el material se ha visto comprometido por contacto con agentes externos.",
    ejemplos: [
      "Producto contaminado microbiológicamente",
      "Material con contaminación cruzada",
      "Mezcla accidental con otra sustancia",
    ],
  },
  dano_operativo: {
    description:
      "Daño causado por fallas de equipos, derrames, o durante fabricación, manipulación, almacenamiento o transporte.",
    cuando: "Aplica cuando el material fue dañado físicamente durante cualquier etapa operativa.",
    ejemplos: [
      "Producto derramado por falla de equipo",
      "Material dañado durante transporte",
      "Envases rotos en almacenamiento",
    ],
  },
  remanentes: {
    description:
      "Barridos, sobrantes, remanentes y residuos de fabricación no susceptibles de recuperación o reproceso.",
    cuando: "Aplica para restos de material que no pueden ser recuperados ni reutilizados.",
    ejemplos: [
      "Barridos de línea de manufactura",
      "Sobrantes de proceso no recuperables",
      "Remanentes de estabilidad",
    ],
  },
  producto_retirado: {
    description:
      "Producto retirado del mercado, devoluciones de clientes o producto deteriorado en distribución.",
    cuando: "Aplica cuando el producto fue devuelto o retirado después de haber salido de la planta.",
    ejemplos: [
      "Devolución de cliente por defecto detectado",
      "Retiro de mercado por alerta regulatoria",
      "Producto deteriorado en cadena de distribución",
    ],
  },
  otras: {
    description: "Causal que no se enmarca en las categorías anteriores. Requiere justificación detallada.",
    cuando: "Aplica únicamente cuando ninguna de las causales anteriores describe adecuadamente la situación.",
    ejemplos: [
      "Destrucción por cambio de proveedor aprobado",
      "Material obsoleto por reformulación",
    ],
  },
};

export const EMPRESAS: Empresa[] = ["Humax", "Farmatech", "Cambridge"];

export const AREAS = [
  "Producción",
  "Control de Calidad",
  "Aseguramiento de Calidad",
  "Dispensado",
  "Manufactura Líquidos",
  "Manufactura Sólidos",
  "Compresión",
  "Recubrimiento",
  "Envase Sólidos",
  "Envase Líquidos",
  "Almacén",
  "Mantenimiento",
  "Planeación",
  "Costos / Finanzas",
  "HSE & S",
  "Regulatorio",
  "I+D",
  "Logística",
  "Compras",
];

export const CAUSAL_DEVOLUCION_OPTIONS = [
  "Información incompleta",
  "Información inconsistente",
  "Error en la clasificación",
  "Error en la causal de destrucción",
  "Error en la identificación del producto",
  "Documentación de soporte faltante",
  "Error en el centro de costos",
  "Error en el costo",
  "Observaciones insuficientes",
  "Información ilegible o ambigua",
  "Otro",
];
