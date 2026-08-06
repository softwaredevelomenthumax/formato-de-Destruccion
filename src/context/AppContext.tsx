import {
  createContext,
  useContext,
  useState,
  useCallback,
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
import {
  INITIAL_USERS,
  INITIAL_ACTAS,
  INITIAL_NOTIFICATIONS,
  INITIAL_SOLICITUDES,
  INITIAL_INVIMA_PRODUCTS,
  generateConsecutivo,
} from "../data/mockData";

function load<T>(key: string, fallback: T): T {
  const s = localStorage.getItem(key);
  return s ? JSON.parse(s) : fallback;
}
function save<T>(key: string, val: T) {
  localStorage.setItem(key, JSON.stringify(val));
}

interface AppContextType {
  users: User[];
  actas: Acta[];
  notifications: Notification[];
  solicitudes: RegistroSolicitud[];
  invimaProducts: InvimaProduct[];

  // Users
  createUser: (u: Omit<User, "id" | "createdAt">) => void;
  updateUser: (id: string, updates: Partial<User>) => void;
  deleteUser: (id: string) => boolean;
  approveSolicitud: (id: string) => void;
  rejectSolicitud: (id: string) => void;
  registerSolicitud: (s: Omit<RegistroSolicitud, "id" | "createdAt" | "status">) => void;

  // Actas
  createActa: (acta: Omit<Acta, "id" | "consecutivo" | "createdAt" | "updatedAt" | "historial" | "aprobaciones" | "requiereCostos">) => Acta;
  updateActa: (id: string, updates: Partial<Acta>, histEntry?: Omit<ActaHistorial, "id">) => void;
  deleteActa: (id: string) => boolean;
  sendActa: (id: string, userId: string, userName: string) => void;
  approveActa: (actaId: string, paso: ActaAprobacion["paso"], aprobador: string, comentario: string) => void;
  rejectActa: (actaId: string, paso: ActaAprobacion["paso"], aprobador: string, motivo: string) => void;
  returnActa: (actaId: string, paso: ActaAprobacion["paso"], aprobador: string, ajustes: ActaAprobacion["ajustes"]) => void;

  // Notifications
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: (userId: string) => void;
  addNotification: (n: Omit<Notification, "id" | "createdAt">) => void;
  getUserNotifications: (userId: string) => Notification[];

  // INVIMA
  addInvimaProduct: (p: Omit<InvimaProduct, "id">) => void;
  updateInvimaProduct: (id: string, updates: Partial<InvimaProduct>) => void;
  deleteInvimaProduct: (id: string) => void;
}

const AppContext = createContext<AppContextType | null>(null);

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
  const [users, setUsers] = useState<User[]>(() => load("add_users", INITIAL_USERS));
  const [actas, setActas] = useState<Acta[]>(() => load("add_actas", INITIAL_ACTAS));
  const [notifications, setNotifications] = useState<Notification[]>(() => load("add_notifications", INITIAL_NOTIFICATIONS));
  const [solicitudes, setSolicitudes] = useState<RegistroSolicitud[]>(() => load("add_solicitudes", INITIAL_SOLICITUDES));
  const [invimaProducts, setInvimaProducts] = useState<InvimaProduct[]>(() => load("add_invima", INITIAL_INVIMA_PRODUCTS));

  const persistUsers = (u: User[]) => { setUsers(u); save("add_users", u); };
  const persistActas = (a: Acta[]) => { setActas(a); save("add_actas", a); };
  const persistNotifications = (n: Notification[]) => { setNotifications(n); save("add_notifications", n); };
  const persistSolicitudes = (s: RegistroSolicitud[]) => { setSolicitudes(s); save("add_solicitudes", s); };
  const persistInvima = (p: InvimaProduct[]) => { setInvimaProducts(p); save("add_invima", p); };

  const now = () => new Date().toISOString();
  const nowDate = () => new Date().toISOString().split("T")[0];
  const nowTime = () => new Date().toTimeString().slice(0, 5);

  const addNotification = useCallback((n: Omit<Notification, "id" | "createdAt">) => {
    setNotifications((prev) => {
      const next = [{ ...n, id: `n${Date.now()}`, createdAt: now() }, ...prev];
      save("add_notifications", next);
      return next;
    });
  }, []);

  // Users
  const createUser = (u: Omit<User, "id" | "createdAt">) => {
    const next = [...users, { ...u, id: `u${Date.now()}`, createdAt: now() }];
    persistUsers(next);
  };

  const updateUser = (id: string, updates: Partial<User>) => {
    persistUsers(users.map((u) => (u.id === id ? { ...u, ...updates } : u)));
  };

  const deleteUser = (id: string): boolean => {
    const hasActas = actas.some(
      (a) => a.solicitanteId === id && !["cerrada", "rechazada"].includes(a.status)
    );
    if (hasActas) return false;
    persistUsers(users.filter((u) => u.id !== id));
    return true;
  };

  const registerSolicitud = (s: Omit<RegistroSolicitud, "id" | "createdAt" | "status">) => {
    const next = [
      ...solicitudes,
      { ...s, id: `s${Date.now()}`, status: "pendiente" as const, createdAt: now() },
    ];
    persistSolicitudes(next);
  };

  const approveSolicitud = (id: string) => {
    const sol = solicitudes.find((s) => s.id === id);
    if (!sol) return;
    const newUser: User = {
      id: `u${Date.now()}`,
      username: sol.username,
      password: "Humax2024*",
      nombre: sol.nombre,
      area: sol.area,
      rol: sol.rolSolicitado,
      email: sol.email,
      status: "activo",
      createdAt: now(),
    };
    persistUsers([...users, newUser]);
    persistSolicitudes(solicitudes.map((s) => s.id === id ? { ...s, status: "aprobado" as const } : s));
  };

  const rejectSolicitud = (id: string) => {
    persistSolicitudes(solicitudes.map((s) => s.id === id ? { ...s, status: "rechazado" as const } : s));
  };

  // Actas
  const createActa = (acta: Omit<Acta, "id" | "consecutivo" | "createdAt" | "updatedAt" | "historial" | "aprobaciones" | "requiereCostos">): Acta => {
    const rc = requiresCostos(acta);
    const newActa: Acta = {
      ...acta,
      id: `a${Date.now()}`,
      consecutivo: generateConsecutivo(actas),
      requiereCostos: rc,
      historial: [{
        id: `h${Date.now()}`,
        usuario: acta.solicitanteNombre,
        fecha: nowDate(),
        hora: nowTime(),
        equipo: "WEB",
        accion: acta.status === "borrador" ? "Borrador guardado" : "Acta creada",
      }],
      aprobaciones: [
        { paso: "area", status: "pendiente" },
        { paso: "costos", status: rc ? "pendiente" : "no_aplica" },
        { paso: "hse", status: "pendiente" },
      ],
      createdAt: now(),
      updatedAt: now(),
    };
    const next = [...actas, newActa];
    persistActas(next);
    return newActa;
  };

  const updateActa = (id: string, updates: Partial<Acta>, histEntry?: Omit<ActaHistorial, "id">) => {
    persistActas(actas.map((a) => {
      if (a.id !== id) return a;
      const hist = histEntry
        ? [...a.historial, { ...histEntry, id: `h${Date.now()}` }]
        : a.historial;
      return { ...a, ...updates, historial: hist, updatedAt: now() };
    }));
  };

  const deleteActa = (id: string): boolean => {
    const acta = actas.find((a) => a.id === id);
    if (!acta || acta.status === "cerrada") return false;
    persistActas(actas.filter((a) => a.id !== id));
    return true;
  };

  const sendActa = (id: string, userId: string, userName: string) => {
    const acta = actas.find((a) => a.id === id);
    if (!acta) return;
    const rc = requiresCostos(acta);
    const newStatus: ActaStatus = "pendiente_aprobacion_area";
    updateActa(id, {
      status: newStatus,
      requiereCostos: rc,
      aprobaciones: [
        { paso: "area", status: "pendiente" },
        { paso: "costos", status: rc ? "pendiente" : "no_aplica" },
        { paso: "hse", status: "pendiente" },
      ],
    }, {
      usuario: userName,
      fecha: nowDate(),
      hora: nowTime(),
      equipo: "WEB",
      accion: "Acta enviada a aprobación",
    });

    // notify aprobadores area
    users.filter((u) => u.rol === "aprobador_area" && u.status === "activo").forEach((u) => {
      addNotification({
        userId: u.id,
        title: "Nueva acta pendiente de aprobación",
        message: `El acta ${acta.consecutivo} requiere su aprobación de área.`,
        type: "info",
        read: false,
        actaId: id,
      });
    });
  };

  const approveActa = (actaId: string, paso: ActaAprobacion["paso"], aprobador: string, comentario: string) => {
    const acta = actas.find((a) => a.id === actaId);
    if (!acta) return;

    const updatedAprobaciones = acta.aprobaciones.map((ap) =>
      ap.paso === paso
        ? { ...ap, status: "aprobado" as const, aprobador, fechaAprobacion: now(), comentario }
        : ap
    );

    let nextStatus: ActaStatus = acta.status;

    if (paso === "area") {
      nextStatus = acta.requiereCostos ? "pendiente_costos" : "pendiente_hse";
      const targetRole = acta.requiereCostos ? "costos" : "hse";
      users.filter((u) => u.rol === targetRole && u.status === "activo").forEach((u) => {
        addNotification({
          userId: u.id,
          title: "Acta pendiente de revisión",
          message: `El acta ${acta.consecutivo} requiere su revisión.`,
          type: "info",
          read: false,
          actaId: actaId,
        });
      });
    } else if (paso === "costos") {
      nextStatus = "pendiente_hse";
      users.filter((u) => u.rol === "hse" && u.status === "activo").forEach((u) => {
        addNotification({
          userId: u.id,
          title: "Acta pendiente de aprobación HSE",
          message: `El acta ${acta.consecutivo} requiere su aprobación final.`,
          type: "info",
          read: false,
          actaId: actaId,
        });
      });
    } else if (paso === "hse") {
      nextStatus = "aprobada";
      addNotification({
        userId: acta.solicitanteId,
        title: "Acta aprobada",
        message: `Su acta ${acta.consecutivo} ha sido completamente aprobada.`,
        type: "success",
        read: false,
        actaId: actaId,
      });
    }

    updateActa(actaId, { status: nextStatus, aprobaciones: updatedAprobaciones }, {
      usuario: aprobador,
      fecha: nowDate(),
      hora: nowTime(),
      equipo: "WEB",
      accion: `Aprobación ${paso.toUpperCase()}`,
    });
  };

  const rejectActa = (actaId: string, paso: ActaAprobacion["paso"], aprobador: string, motivo: string) => {
    const acta = actas.find((a) => a.id === actaId);
    if (!acta) return;

    const updatedAprobaciones = acta.aprobaciones.map((ap) =>
      ap.paso === paso
        ? { ...ap, status: "rechazado" as const, aprobador, fechaAprobacion: now(), motivoRechazo: motivo }
        : ap
    );

    updateActa(actaId, { status: "rechazada", aprobaciones: updatedAprobaciones }, {
      usuario: aprobador,
      fecha: nowDate(),
      hora: nowTime(),
      equipo: "WEB",
      accion: `Rechazo ${paso.toUpperCase()} - Motivo: ${motivo.slice(0, 80)}`,
    });

    addNotification({
      userId: acta.solicitanteId,
      title: "Acta rechazada",
      message: `Su acta ${acta.consecutivo} fue rechazada. Motivo: ${motivo.slice(0, 100)}`,
      type: "error",
      read: false,
      actaId: actaId,
    });
  };

  const returnActa = (actaId: string, paso: ActaAprobacion["paso"], aprobador: string, ajustes: ActaAprobacion["ajustes"]) => {
    const acta = actas.find((a) => a.id === actaId);
    if (!acta) return;

    const updatedAprobaciones = acta.aprobaciones.map((ap) =>
      ap.paso === paso
        ? { ...ap, status: "devuelto" as const, aprobador, fechaAprobacion: now(), ajustes }
        : ap
    );

    updateActa(actaId, { status: "devuelta_ajustes", aprobaciones: updatedAprobaciones }, {
      usuario: aprobador,
      fecha: nowDate(),
      hora: nowTime(),
      equipo: "WEB",
      accion: `Devolución para ajustes - ${paso.toUpperCase()}`,
    });

    addNotification({
      userId: acta.solicitanteId,
      title: "Acta devuelta para ajustes",
      message: `Su acta ${acta.consecutivo} requiere correcciones. Revise los comentarios del aprobador.`,
      type: "warning",
      read: false,
      actaId: actaId,
    });
  };

  // Notifications
  const markNotificationRead = (id: string) => {
    persistNotifications(notifications.map((n) => n.id === id ? { ...n, read: true } : n));
  };

  const markAllNotificationsRead = (userId: string) => {
    persistNotifications(notifications.map((n) => n.userId === userId ? { ...n, read: true } : n));
  };

  const getUserNotifications = useCallback((userId: string) => {
    return notifications.filter((n) => n.userId === userId).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [notifications]);

  // INVIMA
  const addInvimaProduct = (p: Omit<InvimaProduct, "id">) => {
    persistInvima([...invimaProducts, { ...p, id: `inv${Date.now()}` }]);
  };

  const updateInvimaProduct = (id: string, updates: Partial<InvimaProduct>) => {
    persistInvima(invimaProducts.map((p) => p.id === id ? { ...p, ...updates } : p));
  };

  const deleteInvimaProduct = (id: string) => {
    persistInvima(invimaProducts.filter((p) => p.id !== id));
  };

  return (
    <AppContext.Provider value={{
      users, actas, notifications, solicitudes, invimaProducts,
      createUser, updateUser, deleteUser, registerSolicitud, approveSolicitud, rejectSolicitud,
      createActa, updateActa, deleteActa, sendActa, approveActa, rejectActa, returnActa,
      markNotificationRead, markAllNotificationsRead, addNotification, getUserNotifications,
      addInvimaProduct, updateInvimaProduct, deleteInvimaProduct,
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
