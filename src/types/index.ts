export type Role =
  | "administrador"
  | "solicitante"
  | "aprobador_area"
  | "costos"
  | "hse"
  | "planeacion";

export type ActaStatus =
  | "borrador"
  | "creada"
  | "enviada"
  | "pendiente_aprobacion_area"
  | "pendiente_costos"
  | "pendiente_hse"
  | "devuelta_ajustes"
  | "rechazada"
  | "aprobada"
  | "cerrada";

export type UserStatus = "activo" | "inactivo" | "pendiente" | "rechazado";

export type Empresa = "Humax" | "Farmatech" | "Cambridge";

export type ClasificacionMaterial =
  | "materia_prima"
  | "producto_semiterminado"
  | "granel"
  | "producto_terminado"
  | "material_empaque"
  | "reactivos"
  | "remanentes"
  | "muestras"
  | "otro";

export type CausalDestruccion =
  | "material_vencido"
  | "producto_no_conforme"
  | "residuos_proceso"
  | "contaminacion"
  | "dano_operativo"
  | "remanentes"
  | "producto_retirado"
  | "otras";

export interface User {
  id: string;
  username: string;
  password: string;
  nombre: string;
  area: string;
  rol: Role;
  email?: string;
  status: UserStatus;
  createdAt: string;
}

export interface Ceco {
  empresaCode: string;
  empresa: Empresa;
  ceco: string;
  denominacion: string;
  responsable: string;
  departamento: string;
  tipoCosto: string;
  moneda: string;
  status: "Activo" | "Inactivo";
}

export interface InvimaProduct {
  id: string;
  productName: string;
  registryNumber: string;
  internalStatus: "Vigente" | "Vencido" | "Cancelado";
  holder: string;
  tipoMedicamento: string;
  controlado: boolean;
  presentacion?: string;
}

export interface ActaHistorial {
  id: string;
  usuario: string;
  fecha: string;
  hora: string;
  equipo: string;
  accion: string;
  campo?: string;
  valorAnterior?: string;
  valorNuevo?: string;
}

export interface AjusteField {
  campo: string;
  correccion: string;
  comentario: string;
}

export interface ActaAprobacion {
  paso: "area" | "costos" | "hse";
  aprobador?: string;
  fechaAprobacion?: string;
  status: "pendiente" | "aprobado" | "rechazado" | "devuelto" | "no_aplica";
  comentario?: string;
  motivoRechazo?: string;
  ajustes?: AjusteField[];
}

export interface Acta {
  id: string;
  consecutivo: string;
  status: ActaStatus;
  empresa: Empresa;
  centroCostos: string;
  fecha: string;
  solicitanteId: string;
  solicitanteNombre: string;
  responsable: string;
  area: string;
  descripcion: string;
  codigoSAP: string;
  numeroLote: string;
  ordenProduccion: string;
  sustanciaControlada: boolean;
  clasificacion: ClasificacionMaterial;
  fechaVencimiento: string;
  registroINVIMA: string;
  pesoKg: number;
  cantidadUnidades: number;
  costoDestruccion: number;
  causal: CausalDestruccion;
  otraCausal?: string;
  observaciones: string;
  adjuntos: string[];
  createdAt: string;
  updatedAt: string;
  historial: ActaHistorial[];
  aprobaciones: ActaAprobacion[];
  requiereCostos: boolean;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  read: boolean;
  createdAt: string;
  actaId?: string;
}

export interface RegistroSolicitud {
  id: string;
  username: string;
  nombre: string;
  area: string;
  rolSolicitado: Role;
  email?: string;
  status: "pendiente" | "aprobado" | "rechazado";
  createdAt: string;
}
