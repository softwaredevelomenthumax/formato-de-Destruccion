import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import type {
  User,
  Acta,
  Notification,
  RegistroSolicitud,
  InvimaProduct,
  ActaStatus,
  ActaAprobacion,
  ActaHistorial,
} from "../types";
import { api } from "../services/api.ts";
import { useAuth } from "./AuthContext";

interface AppContextType {
  users: User[];
  actas: Acta[];
  notifications: Notification[];
  solicitudes: RegistroSolicitud[];
  invimaProducts: InvimaProduct[];
  loading: boolean;

  // Users
  createUser: (u: Omit<User, "id" | "createdAt">) => Promise<void>;
  updateUser: (id: string, updates: Partial<User>) => Promise<void>;
  deleteUser: (id: string) => Promise<boolean>;
  approveSolicitud: (id: string) => Promise<void>;
  rejectSolicitud: (id: string) => Promise<void>;
  registerSolicitud: (s: Omit<RegistroSolicitud, "id" | "createdAt" | "status">) => Promise<void>;

  // Actas
  createActa: (acta: Omit<Acta, "id" | "consecutivo" | "createdAt" | "updatedAt" | "historial" | "aprobaciones" | "requiereCostos">) => Promise<Acta>;
  updateActa: (id: string, updates: Partial<Acta>, histEntry?: Omit<ActaHistorial, "id">) => Promise<void>;
  deleteActa: (id: string) => Promise<boolean>;
  sendActa: (id: string, userId: string, userName: string) => Promise<void>;
  approveActa: (actaId: string, paso: ActaAprobacion["paso"], aprobador: string, comentario: string) => Promise<void>;
  rejectActa: (actaId: string, paso: ActaAprobacion["paso"], aprobador: string, motivo: string) => Promise<void>;
  returnActa: (actaId: string, paso: ActaAprobacion["paso"], aprobador: string, ajustes: ActaAprobacion["ajustes"]) => Promise<void>;

  // Notifications
  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: (userId: string) => Promise<void>;
  addNotification: (n: Omit<Notification, "id" | "createdAt">) => Promise<void>;
  getUserNotifications: (userId: string) => Notification[];
  loadNotifications: (userId: string) => Promise<void>;

  // INVIMA
  addInvimaProduct: (p: Omit<InvimaProduct, "id">) => Promise<void>;
  updateInvimaProduct: (id: string, updates: Partial<InvimaProduct>) => Promise<void>;
  deleteInvimaProduct: (id: string) => Promise<void>;
  loadData: () => Promise<void>;
}

const AppContext = createContext<AppContextType | null>(null);

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? value as T[] : [];
}

function requiresCostos(acta: Partial<Acta>): boolean {
  const { clasificacion, fechaVencimiento, causal } = acta;
  if (!fechaVencimiento) return false;
  const venc = new Date(fechaVencimiento);
  const now = new Date();
  const diffMs = venc.getTime() - now.getTime();
  const diffMonths = diffMs / (1000 * 60 * 60 * 24 * 30);

  if (clasificacion === "producto_terminado" && diffMonths < 12) return true;
  if (clasificacion === "materia_prima" && diffMonths < 6) return true;
  if (clasificacion === "material_empaque") return true;
  if (causal === "dano_operativo" || causal === "producto_no_conforme") return true;
  return false;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const { token } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [actas, setActas] = useState<Acta[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [solicitudes, setSolicitudes] = useState<RegistroSolicitud[]>([]);
  const [invimaProducts, setInvimaProducts] = useState<InvimaProduct[]>([]);
  const [loading, setLoading] = useState(false);

  // Cargar datos iniciales
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [usersData, actasData, solicitudesData, invimaData] = await Promise.all([
        api.getUsers(),
        api.getActas(),
        api.getSolicitudes(),
        api.getInvimaProducts(),
      ]);

      setUsers(asArray<User>(usersData));
      setActas(asArray<Acta>(actasData));
      setSolicitudes(asArray<RegistroSolicitud>(solicitudesData));
      setInvimaProducts(asArray<InvimaProduct>(invimaData));
    } catch (error) {
      console.error("Error cargando datos:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Cargar datos al montar
  useEffect(() => {
    if (token) {
      loadData();
      return;
    }

    setUsers([]);
    setActas([]);
    setSolicitudes([]);
    setInvimaProducts([]);
  }, [loadData, token]);

  // Users
  const createUser = async (u: Omit<User, "id" | "createdAt">) => {
    try {
      const newUser = await api.createUser(u);
      setUsers((current) => [...asArray<User>(current), newUser]);
    } catch (error) {
      console.error("Error creando usuario:", error);
      throw error;
    }
  };

  const updateUser = async (id: string, updates: Partial<User>) => {
    try {
      await api.updateUser(id, updates);
      setUsers((current) => asArray<User>(current).map((u) => (u.id === id ? { ...u, ...updates } : u)));
    } catch (error) {
      console.error("Error actualizando usuario:", error);
      throw error;
    }
  };

  const deleteUser = async (id: string): Promise<boolean> => {
    try {
      await api.deleteUser(id);
      setUsers((current) => asArray<User>(current).filter((u) => u.id !== id));
      return true;
    } catch (error) {
      console.error("Error eliminando usuario:", error);
      return false;
    }
  };

  const registerSolicitud = async (s: Omit<RegistroSolicitud, "id" | "createdAt" | "status">) => {
    try {
      const newSolicitud = await api.createSolicitud(s);
      setSolicitudes((current) => [...asArray<RegistroSolicitud>(current), newSolicitud]);
    } catch (error) {
      console.error("Error registrando solicitud:", error);
      throw error;
    }
  };

  const approveSolicitud = async (id: string) => {
    try {
      await api.approveSolicitud(id);
      // Recargar usuarios después de aprobar
      const usersData = await api.getUsers();
      setUsers(asArray<User>(usersData));
      setSolicitudes((current) => asArray<RegistroSolicitud>(current).map((s) => s.id === id ? { ...s, status: "aprobado" as const } : s));
    } catch (error) {
      console.error("Error aprobando solicitud:", error);
      throw error;
    }
  };

  const rejectSolicitud = async (id: string) => {
    try {
      await api.rejectSolicitud(id);
      setSolicitudes((current) => asArray<RegistroSolicitud>(current).map((s) => s.id === id ? { ...s, status: "rechazado" as const } : s));
    } catch (error) {
      console.error("Error rechazando solicitud:", error);
      throw error;
    }
  };

  // Actas
  const createActa = async (acta: Omit<Acta, "id" | "consecutivo" | "createdAt" | "updatedAt" | "historial" | "aprobaciones" | "requiereCostos">): Promise<Acta> => {
    try {
      const rc = requiresCostos(acta);
      const newActa = await api.createActa({ ...acta, requiereCostos: rc });
      setActas((current) => [...asArray<Acta>(current), newActa]);
      return newActa;
    } catch (error) {
      console.error("Error creando acta:", error);
      throw error;
    }
  };

  const updateActa = async (id: string, updates: Partial<Acta>, histEntry?: Omit<ActaHistorial, "id">) => {
    try {
      await api.updateActa(id, updates);
      setActas((current) => asArray<Acta>(current).map((a) => a.id === id ? { ...a, ...updates } : a));
    } catch (error) {
      console.error("Error actualizando acta:", error);
      throw error;
    }
  };

  const deleteActa = async (id: string): Promise<boolean> => {
    try {
      await api.deleteActa(id);
      setActas((current) => asArray<Acta>(current).filter((a) => a.id !== id));
      return true;
    } catch (error) {
      console.error("Error eliminando acta:", error);
      return false;
    }
  };

  const sendActa = async (id: string, userId: string, userName: string) => {
    try {
      const acta = actas.find((a) => a.id === id);
      if (!acta) return;
      
      const rc = requiresCostos(acta);
      const newStatus: ActaStatus = "pendiente_aprobacion_area";
      
      await updateActa(id, {
        status: newStatus,
        requiereCostos: rc,
        aprobaciones: [
          { paso: "area", status: "pendiente" },
          { paso: "costos", status: rc ? "pendiente" : "no_aplica" },
          { paso: "hse", status: "pendiente" },
        ],
      });

      // Notificar aprobadores de área
      const areaAprobadores = users.filter((u) => u.rol === "aprobador_area" && u.status === "activo");
      for (const u of areaAprobadores) {
        await addNotification({
          userId: u.id,
          title: "Nueva acta pendiente de aprobación",
          message: `El acta ${acta.consecutivo} requiere su aprobación de área.`,
          type: "info",
          read: false,
        });
      }
    } catch (error) {
      console.error("Error enviando acta:", error);
      throw error;
    }
  };

  const approveActa = async (actaId: string, paso: ActaAprobacion["paso"], aprobador: string, comentario: string) => {
    try {
      const acta = actas.find((a) => a.id === actaId);
      if (!acta) return;

      await api.approveActa(actaId, { paso, aprobador, comentario });

      // Actualizar estado local
      let nextStatus: ActaStatus = acta.status;
      const updatedAprobaciones = acta.aprobaciones.map((ap) =>
        ap.paso === paso ? { ...ap, status: "aprobado" as const } : ap
      );

      if (paso === "area") {
        nextStatus = acta.requiereCostos ? "pendiente_costos" : "pendiente_hse";
      } else if (paso === "costos") {
        nextStatus = "pendiente_hse";
      } else if (paso === "hse") {
        nextStatus = "aprobada";
      }

      setActas((current) => asArray<Acta>(current).map((a) =>
        a.id === actaId ? { ...a, status: nextStatus, aprobaciones: updatedAprobaciones } : a
      ));
    } catch (error) {
      console.error("Error aprobando acta:", error);
      throw error;
    }
  };

  const rejectActa = async (actaId: string, paso: ActaAprobacion["paso"], aprobador: string, motivo: string) => {
    try {
      const acta = actas.find((a) => a.id === actaId);
      if (!acta) return;

      await api.rejectActa(actaId, { paso, aprobador, motivo });

      const updatedAprobaciones = acta.aprobaciones.map((ap) =>
        ap.paso === paso ? { ...ap, status: "rechazado" as const } : ap
      );

      setActas((current) => asArray<Acta>(current).map((a) =>
        a.id === actaId ? { ...a, status: "rechazada", aprobaciones: updatedAprobaciones } : a
      ));

      // Notificar al solicitante
      await addNotification({
        userId: acta.solicitanteId,
        title: "Acta rechazada",
        message: `Su acta ${acta.consecutivo} fue rechazada.`,
        type: "error",
        read: false,
      });
    } catch (error) {
      console.error("Error rechazando acta:", error);
      throw error;
    }
  };

  const returnActa = async (actaId: string, paso: ActaAprobacion["paso"], aprobador: string, ajustes: ActaAprobacion["ajustes"]) => {
    try {
      const acta = actas.find((a) => a.id === actaId);
      if (!acta) return;

      await api.updateActa(actaId, { status: "devuelta_ajustes" });

      const updatedAprobaciones = acta.aprobaciones.map((ap) =>
        ap.paso === paso ? { ...ap, status: "devuelto" as const } : ap
      );

      setActas((current) => asArray<Acta>(current).map((a) =>
        a.id === actaId ? { ...a, status: "devuelta_ajustes", aprobaciones: updatedAprobaciones } : a
      ));

      // Notificar al solicitante
      await addNotification({
        userId: acta.solicitanteId,
        title: "Acta devuelta para ajustes",
        message: `Su acta ${acta.consecutivo} requiere correcciones.`,
        type: "warning",
        read: false,
      });
    } catch (error) {
      console.error("Error devolviendo acta:", error);
      throw error;
    }
  };

  // Notifications
  const loadNotifications = async (userId: string) => {
    try {
      const data = await api.getNotifications(userId);
      setNotifications(asArray<Notification>(data));
    } catch (error) {
      console.error("Error cargando notificaciones:", error);
    }
  };

  const markNotificationRead = async (id: string) => {
    try {
      await api.markNotificationRead(id);
      setNotifications((current) => asArray<Notification>(current).map((n) => n.id === id ? { ...n, read: true } : n));
    } catch (error) {
      console.error("Error marcando notificación como leída:", error);
      throw error;
    }
  };

  const markAllNotificationsRead = async (userId: string) => {
    try {
      await api.markAllNotificationsRead(userId);
      setNotifications((current) => asArray<Notification>(current).map((n) => n.userId === userId ? { ...n, read: true } : n));
    } catch (error) {
      console.error("Error marcando notificaciones como leídas:", error);
      throw error;
    }
  };

  const addNotification = async (n: Omit<Notification, "id" | "createdAt">) => {
    try {
      const newNotification = await api.createNotification(n);
      setNotifications((current) => [newNotification, ...asArray<Notification>(current)]);
    } catch (error) {
      console.error("Error creando notificación:", error);
      throw error;
    }
  };

  const getUserNotifications = useCallback((userId: string) => {
    return asArray<Notification>(notifications)
      .filter((n) => n.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [notifications]);

  // INVIMA
  const addInvimaProduct = async (p: Omit<InvimaProduct, "id">) => {
    try {
      const newProduct = await api.createInvimaProduct(p);
      setInvimaProducts((current) => [...asArray<InvimaProduct>(current), newProduct]);
    } catch (error) {
      console.error("Error creando producto INVIMA:", error);
      throw error;
    }
  };

  const updateInvimaProduct = async (id: string, updates: Partial<InvimaProduct>) => {
    try {
      await api.updateInvimaProduct(id, updates);
      setInvimaProducts((current) => asArray<InvimaProduct>(current).map((p) => p.id === id ? { ...p, ...updates } : p));
    } catch (error) {
      console.error("Error actualizando producto INVIMA:", error);
      throw error;
    }
  };

  const deleteInvimaProduct = async (id: string) => {
    try {
      await api.deleteInvimaProduct(id);
      setInvimaProducts((current) => asArray<InvimaProduct>(current).filter((p) => p.id !== id));
    } catch (error) {
      console.error("Error eliminando producto INVIMA:", error);
      throw error;
    }
  };

  return (
    <AppContext.Provider value={{
      users, actas, notifications, solicitudes, invimaProducts, loading,
      createUser, updateUser, deleteUser, registerSolicitud, approveSolicitud, rejectSolicitud,
      createActa, updateActa, deleteActa, sendActa, approveActa, rejectActa, returnActa,
      markNotificationRead, markAllNotificationsRead, addNotification, getUserNotifications, loadNotifications,
      addInvimaProduct, updateInvimaProduct, deleteInvimaProduct, loadData,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
