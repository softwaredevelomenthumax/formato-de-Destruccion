import type {
  Role,
  ActaStatus,
  ClasificacionMaterial,
  CausalDestruccion,
  Empresa,
} from "../types";

export const ROLE_LABELS: Record<Role, string> = {
  administrador: "Administrador",
  admin_global: "Administrador global",
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
  PT: "Producto terminado (PT)",
  ME: "Material de empaque (ME)",
  MP: "Materia prima (MP)",
  ST: "Semiterminado (ST)",
  SQ: "Sustancia química (SQ)",
  residuo_comun: "Residuos peligrosos comunes",
  residuo_aprovechable: "Residuo aprovechable",
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
  producto_no_conforme: "Material no conforme",
  residuos_proceso: "Residuos de Proceso",
  contaminacion: "Contaminación",
  dano_operativo: "Daño Operativo",
  remanentes: "Remanentes",
  producto_retirado: "Material retirado",
  otras: "Otras Causales",
};

export const CAUSAL_DESCRIPTIONS: Record<
  CausalDestruccion,
  { description: string; cuando: string; ejemplos: string[] }
> = {
  material_vencido: {
    description: "Material que super? su fecha de vencimiento o su tiempo permitido de almacenamiento.",
    cuando: "Aplica cuando el material ya no puede utilizarse por su fecha o condici?n de almacenamiento.",
    ejemplos: ["Materia prima vencida", "Material de empaque vencido", "Producto terminado vencido"],
  },
  producto_no_conforme: {
    description: "Material que no cumple las especificaciones, requisitos de calidad, integridad o identificaci?n establecidos.",
    cuando: "Aplica cuando una inspecci?n o evaluaci?n confirma que el material no cumple los criterios definidos.",
    ejemplos: ["Materia prima fuera de especificaci?n", "Empaque con identificaci?n incorrecta", "Producto con defectos visibles"],
  },
  residuos_proceso: {
    description: "Residuos o sobrantes generados durante procesos de fabricaci?n, operaci?n, an?lisis o mantenimiento.",
    cuando: "Aplica cuando el residuo se genera como resultado de una actividad operativa y no puede reutilizarse.",
    ejemplos: ["Sobrantes de producci?n", "Muestras de an?lisis", "Residuos de limpieza de equipos"],
  },
  contaminacion: {
    description: "Material contaminado o mezclado accidentalmente con agentes o materiales que comprometen su uso seguro.",
    cuando: "Aplica cuando el contacto o mezcla afecta la calidad, seguridad o disposici?n adecuada del material.",
    ejemplos: ["Contaminaci?n cruzada", "Contacto con una sustancia externa", "Mezcla accidental de materiales"],
  },
  dano_operativo: {
    description: "Material deteriorado durante su fabricaci?n, manipulaci?n, almacenamiento o transporte.",
    cuando: "Aplica cuando una falla o incidente operativo impide utilizar o recuperar el material.",
    ejemplos: ["Material derramado", "Empaque roto durante transporte", "Da?o por falla de equipo"],
  },
  remanentes: {
    description: "Restos, sobrantes o remanentes que no pueden recuperarse, aprovecharse ni reprocesarse.",
    cuando: "Aplica cuando el material restante no tiene una alternativa segura de reutilizaci?n o recuperaci?n.",
    ejemplos: ["Barridos de ?rea", "Sobrantes no recuperables", "Remanentes de una operaci?n"],
  },
  producto_retirado: {
    description: "Material retirado de uso, distribuci?n o mercado, o devuelto por un cliente y no apto para reutilizaci?n.",
    cuando: "Aplica cuando se determina que el material retirado o devuelto debe destruirse.",
    ejemplos: ["Devoluci?n de cliente", "Retiro por alerta de calidad", "Material deteriorado en distribuci?n"],
  },
  otras: {
    description: "Causal que no se ajusta a las categor?as anteriores. Requiere una justificaci?n detallada.",
    cuando: "Aplica ?nicamente cuando ninguna de las otras causales describe adecuadamente el motivo.",
    ejemplos: ["Material obsoleto por cambio de proceso", "Cambio de proveedor", "Otra raz?n documentada"],
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
  "TI",
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
