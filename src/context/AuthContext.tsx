import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import type { Role, User } from "../types";
import { api } from "../services/api.ts";

const VALID_ROLES: Role[] = ["administrador", "solicitante", "aprobador_area", "costos", "hse", "planeacion"];

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
  };

  return aliases[normalized] ?? (VALID_ROLES.includes(normalized as Role) ? normalized as Role : null);
}

function normalizeUser(value: Partial<User> | null): User | null {
  const role = normalizeRole(value?.rol);
  if (!value?.id || !role) return null;
  return { ...value, rol: role } as User;
}

interface AuthContextType {
  user: User | null;
  users: User[];
  login: (username: string, password: string) => Promise<{ success: boolean; message: string }>;
  logout: () => void;
  updateCurrentUser: (changes: Partial<User>) => void;
  isAuthenticated: boolean;
  token: string | null;
  setToken: (token: string | null) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const stored = localStorage.getItem("add_current_user");
      if (!stored) return null;

      const parsed = normalizeUser(JSON.parse(stored) as Partial<User> | null);
      if (!parsed) {
        localStorage.removeItem("add_current_user");
        return null;
      }

      return parsed;
    } catch {
      localStorage.removeItem("add_current_user");
      return null;
    }
  });

  const [users, setUsers] = useState<User[]>([]);
  const [token, setTokenState] = useState<string | null>(() => {
    try {
      return localStorage.getItem("add_token");
    } catch {
      return null;
    }
  });

  const setToken = useCallback((newToken: string | null) => {
    if (newToken) {
      localStorage.setItem("add_token", newToken);
    } else {
      localStorage.removeItem("add_token");
    }
    setTokenState(newToken);
  }, []);

  const updateCurrentUser = useCallback((changes: Partial<User>) => {
    setUser((current) => {
      if (!current) return current;

      const updatedUser = { ...current, ...changes };
      localStorage.setItem("add_current_user", JSON.stringify(updatedUser));
      return updatedUser;
    });
  }, []);

  useEffect(() => {
    if (!token) {
      setUser(null);
      localStorage.removeItem("add_current_user");
      return;
    }

    if (user) {
      localStorage.setItem("add_current_user", JSON.stringify(user));
    } else {
      localStorage.removeItem("add_current_user");
    }
  }, [user, token]);

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

      localStorage.removeItem("add_current_user");
      localStorage.removeItem("add_token");
      localStorage.removeItem("add-sidebar-collapsed");
      setToken(response.token);
      setUser(normalizeUser(response.user) ?? null);
      return { success: true, message: "Bienvenido" };
    } catch (error) {
      return { success: false, message: "Error conectando al servidor" };
    }
  };

  const logout = () => {
    localStorage.removeItem("add_current_user");
    localStorage.removeItem("add_token");
    localStorage.removeItem("add-sidebar-collapsed");
    localStorage.removeItem("add_remember_me");
    localStorage.removeItem("add_remember_username");
    localStorage.removeItem("add_remember_password");
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, users, login, logout, updateCurrentUser, isAuthenticated: !!user, token, setToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
