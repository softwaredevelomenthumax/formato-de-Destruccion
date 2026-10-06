import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from "react";
import type { Role, User } from "../types";
import { api } from "../services/api.ts";

const VALID_ROLES: Role[] = ["administrador", "admin_global", "solicitante", "aprobador_area", "costos", "hse", "planeacion", "lab_calidad"];

function normalizeRole(value: unknown): Role | null {
  if (typeof value !== "string") return null;

  const normalized = value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[ -]+/g, "_");
  const aliases: Record<string, Role> = {
    admin: "administrador",
    administrator: "administrador",
    global_admin: "admin_global",
    administrador_global: "admin_global",
  };

  return aliases[normalized] ?? (VALID_ROLES.includes(normalized as Role) ? normalized as Role : null);
}

function normalizeUser(value: Partial<User> | null): User | null {
  const role = normalizeRole(value?.rol);
  if (!value?.id || !role) return null;
  return { ...value, rol: role } as User;
}

function getStoredSessionUser(): User | null {
  try {
    const stored = sessionStorage.getItem("add_current_user");
    return stored ? normalizeUser(JSON.parse(stored)) : null;
  } catch {
    sessionStorage.removeItem("add_current_user");
    return null;
  }
}

interface AuthContextType {
  user: User | null;
  users: User[];
  login: (username: string, password: string) => Promise<{ success: boolean; message: string }>;
  devLogin: (username: string) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  updateCurrentUser: (changes: Partial<User>) => void;
  refreshSession: () => Promise<void>;
  isAuthenticated: boolean;
  token: string | null;
  setToken: (token: string | null) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  // La sesión se mantiene únicamente mientras la aplicación está abierta.
  // Al recargar o volver a abrir, siempre se solicita iniciar sesión.
  const [user, setUser] = useState<User | null>(getStoredSessionUser);

  const [users, setUsers] = useState<User[]>([]);
  const [token, setTokenState] = useState<string | null>(() => sessionStorage.getItem("add_token"));
  const sessionRefreshAttemptedRef = useRef(false);

  const setToken = useCallback((newToken: string | null) => {
    setTokenState(newToken);
    if (newToken) sessionStorage.setItem("add_token", newToken);
    else sessionStorage.removeItem("add_token");
  }, []);

  const refreshSession = useCallback(async () => {
    const response = await api.refreshSession();
    const refreshedUser = normalizeUser(response.user);
    if (!refreshedUser || !response.token) throw new Error("No se pudo actualizar la sesión");
    setToken(response.token);
    setUser(refreshedUser);
  }, [setToken]);

  const updateCurrentUser = useCallback((changes: Partial<User>) => {
    setUser((current) => {
      if (!current) return current;

      const updatedUser = { ...current, ...changes };
      sessionStorage.setItem("add_current_user", JSON.stringify(updatedUser));
      return updatedUser;
    });
  }, []);

  useEffect(() => {
    if (!token) {
      setUser(null);
      sessionStorage.removeItem("add_current_user");
      return;
    }

    if (user) {
      sessionStorage.setItem("add_current_user", JSON.stringify(user));
    } else {
      sessionStorage.removeItem("add_current_user");
    }
  }, [user, token]);

  useEffect(() => {
    if (!token) {
      sessionRefreshAttemptedRef.current = false;
      return;
    }
    if (sessionRefreshAttemptedRef.current) return;

    sessionRefreshAttemptedRef.current = true;
    void refreshSession().catch((error) => {
      console.error("No se pudo sincronizar el rol de la sesión:", error);
    });
  }, [token, refreshSession]);

  // Cargar usuarios al iniciar
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const data = await api.getUsers();
        setUsers(data);
      } catch (error) {
        console.error("Error cargando usuarios:", error);
      }
    };
    if (token) {
      loadUsers();
    }
  }, [token]);

  const login = async (username: string, password: string) => {
    try {
      const response = await api.login({ username, password });

      if (response.error) {
        return { success: false, message: response.error };
      }

      sessionStorage.removeItem("add_current_user");
      sessionStorage.removeItem("add_token");
      localStorage.removeItem("add-sidebar-collapsed");
      setToken(response.token);
      setUser(normalizeUser(response.user) ?? null);
      return { success: true, message: "Bienvenido" };
    } catch (error) {
      return { success: false, message: "Error conectando al servidor" };
    }
  };

  const devLogin = async (username: string) => {
    try {
      const response = await api.devLogin(username);
      if (!response.token || !response.user) return { success: false, message: response.error || "No se pudo iniciar la sesión de prueba" };

      sessionStorage.removeItem("add_current_user");
      sessionStorage.removeItem("add_token");
      localStorage.removeItem("add-sidebar-collapsed");
      setToken(response.token);
      setUser(normalizeUser(response.user) ?? null);
      return { success: true, message: "Sesión de prueba iniciada" };
    } catch (error) {
      return { success: false, message: error instanceof Error ? error.message : "No se pudo iniciar la sesión de prueba" };
    }
  };

  const logout = () => {
    sessionStorage.removeItem("add_current_user");
    sessionStorage.removeItem("add_token");
    localStorage.removeItem("add-sidebar-collapsed");
    localStorage.removeItem("add_remember_me");
    localStorage.removeItem("add_remember_username");
    localStorage.removeItem("add_remember_password");
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, users, login, devLogin, logout, updateCurrentUser, refreshSession, isAuthenticated: !!user, token, setToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
