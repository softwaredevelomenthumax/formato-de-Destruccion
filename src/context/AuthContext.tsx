import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import type { User } from "../types";
import { INITIAL_USERS } from "../data/mockData";

interface AuthContextType {
  user: User | null;
  users: User[];
  login: (username: string, password: string) => { success: boolean; message: string };
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem("add_current_user");
    return stored ? JSON.parse(stored) : null;
  });

  const [users] = useState<User[]>(() => {
    const stored = localStorage.getItem("add_users");
    return stored ? JSON.parse(stored) : INITIAL_USERS;
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem("add_current_user", JSON.stringify(user));
    } else {
      localStorage.removeItem("add_current_user");
    }
  }, [user]);

  const login = (username: string, password: string) => {
    const allUsers: User[] = JSON.parse(localStorage.getItem("add_users") || JSON.stringify(INITIAL_USERS));
    const found = allUsers.find(
      (u) => u.username === username && u.password === password
    );
    if (!found) return { success: false, message: "Usuario o contraseña incorrectos." };
    if (found.status === "pendiente")
      return { success: false, message: "Su cuenta está pendiente de aprobación por el administrador." };
    if (found.status === "rechazado")
      return { success: false, message: "Su solicitud de acceso fue rechazada. Contacte al administrador." };
    if (found.status === "inactivo")
      return { success: false, message: "Su cuenta está desactivada. Contacte al administrador." };
    setUser(found);
    return { success: true, message: "Bienvenido" };
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, users, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
