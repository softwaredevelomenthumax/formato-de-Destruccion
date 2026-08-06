import { useState, useEffect } from "react";
import { NavLink } from "react-router";
import {
  LayoutDashboard, FileText, FilePlus, Users, Settings, BarChart3,
  Search, Bell, BookOpen, Package, LogOut, ChevronRight,
  ClipboardCheck, Building2, PanelLeftClose, PanelLeftOpen,
  Sun, Moon
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useApp } from "../../context/AppContext";
import type { Role } from "../../types";
import logi from "../../assets/logi.png";

import type { ReactNode } from "react";

interface NavItem {
  to: string;
  label: string;
  icon: ReactNode;
  roles: Role[];
  badge?: string;
}

const NAV_ITEMS: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: <LayoutDashboard size={18} />, roles: ["administrador", "solicitante", "aprobador_area", "costos", "hse", "planeacion"] },
  { to: "/actas", label: "Actas de Destrucción", icon: <FileText size={18} />, roles: ["administrador", "solicitante", "aprobador_area", "costos", "hse", "planeacion"] },
  { to: "/actas/nueva", label: "Nueva Acta", icon: <FilePlus size={18} />, roles: ["solicitante"] },
  { to: "/aprobaciones", label: "Pendientes de Aprobación", icon: <ClipboardCheck size={18} />, roles: ["aprobador_area", "costos", "hse"] },
  { to: "/usuarios", label: "Gestión de Usuarios", icon: <Users size={18} />, roles: ["administrador"] },
  { to: "/maestros/cecos", label: "Maestro CeCos", icon: <Building2 size={18} />, roles: ["administrador", "costos"] },
  { to: "/maestros/invima", label: "Maestro INVIMA", icon: <Package size={18} />, roles: ["administrador", "planeacion"] },
  { to: "/reportes", label: "Reportes", icon: <BarChart3 size={18} />, roles: ["administrador", "aprobador_area", "costos", "hse", "planeacion"] },
  { to: "/busqueda", label: "Búsqueda Global", icon: <Search size={18} />, roles: ["administrador", "solicitante", "aprobador_area", "costos", "hse", "planeacion"] },
];

const THEME_KEY = "add-theme";
const COLLAPSED_KEY = "add-sidebar-collapsed";

type Theme = "light" | "dark";

function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "light";
  const stored = localStorage.getItem(THEME_KEY);
  if (stored === "light" || stored === "dark") return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function getInitialCollapsed(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(COLLAPSED_KEY) === "true";
}

export function Sidebar() {
  const { user, logout } = useAuth();
  const { getUserNotifications, solicitudes } = useApp();

  const [collapsed, setCollapsed] = useState<boolean>(getInitialCollapsed);
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  // Aplica la clase "dark" al <html> para que cualquier utilidad `dark:` de
  // Tailwind, en este componente o en el resto de la app, reaccione al cambio.
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem(COLLAPSED_KEY, String(collapsed));
  }, [collapsed]);

  if (!user) return null;

  const unread = getUserNotifications(user.id).filter((n) => !n.read).length;
  const pendingSolicitudes = solicitudes.filter((s) => s.status === "pendiente").length;

  const filteredNav = NAV_ITEMS.filter((item) => item.roles.includes(user.rol));
  const toggleTheme = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  return (
    <aside
      className={`${collapsed ? "w-[68px]" : "w-60"} relative flex h-full shrink-0 flex-col
        bg-white dark:bg-slate-900 transition-[width] duration-200 ease-in-out`}
    >
      {/* Botón de colapsar */}
      <button
        onClick={() => setCollapsed((c) => !c)}
        title={collapsed ? "Expandir barra lateral" : "Colapsar barra lateral"}
        className="absolute -right-3 top-16 z-10 flex h-6 w-6 items-center justify-center rounded-full
          border border-slate-200 bg-white text-slate-500 shadow-sm transition-colors
          hover:bg-slate-50 hover:text-slate-900
          dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white"
      >
        {collapsed ? <PanelLeftOpen size={13} /> : <PanelLeftClose size={13} />}
      </button>

      {/* Logo */}
      <div className={`flex items-center border-b border-slate-200 dark:border-slate-800 ${collapsed ? "justify-center px-2 py-5" : "px-5 py-5"}`}>
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-600">
            <img src={logi} alt="Logo" className="h-6 w-6" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate text-sm font-bold leading-tight text-slate-900 dark:text-white">Sistema ADD</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto overflow-x-hidden px-3 py-4">
        {filteredNav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/dashboard"}
            title={collapsed ? item.label : undefined}
            className={({ isActive }) =>
              `group flex items-center gap-3 rounded-lg text-sm font-medium transition-all ${
                collapsed ? "justify-center px-2 py-2.5" : "px-3 py-2.5"
              } ${
                isActive
                  ? "bg-blue-600 text-white"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
              }`
            }
          >
            <span className="shrink-0">{item.icon}</span>
            {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
            {!collapsed && item.to === "/notificaciones" && unread > 0 && (
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
                {unread > 9 ? "9+" : unread}
              </span>
            )}
            {!collapsed && item.to === "/usuarios" && pendingSolicitudes > 0 && user.rol === "administrador" && (
              <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-500 px-1 text-xs font-bold text-white">
                {pendingSolicitudes}
              </span>
            )}
            {!collapsed && <ChevronRight size={12} className="shrink-0 opacity-0 group-hover:opacity-50" />}
          </NavLink>
        ))}

        <NavLink
          to="/notificaciones"
          title={collapsed ? "Notificaciones" : undefined}
          className={({ isActive }) =>
            `group relative flex items-center gap-3 rounded-lg text-sm font-medium transition-all ${
              collapsed ? "justify-center px-2 py-2.5" : "px-3 py-2.5"
            } ${
              isActive
                ? "bg-blue-600 text-white"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
            }`
          }
        >
          <Bell size={18} />
          {!collapsed && <span className="flex-1">Notificaciones</span>}
          {unread > 0 && (
            <span
              className={`flex items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white ${
                collapsed ? "absolute right-1 top-1 h-4 w-4" : "h-4 min-w-4 px-1"
              }`}
            >
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </NavLink>
      </nav>

      {/* Interruptor de modo claro/oscuro */}
      <div className={`border-t border-slate-200 dark:border-slate-800 ${collapsed ? "flex justify-center px-2 py-3" : "px-3 py-3"}`}>
        {collapsed ? (
          <button
            onClick={toggleTheme}
            title={theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors
              hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
          >
            {theme === "dark" ? <Moon size={16} /> : <Sun size={16} />}
          </button>
        ) : (
          <button
            onClick={toggleTheme}
            className="flex w-full items-center justify-between rounded-lg px-3 py-2 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <span className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300">
              {theme === "dark" ? <Moon size={16} /> : <Sun size={16} />}
              {theme === "dark" ? "Modo oscuro" : "Modo claro"}
            </span>
            <span
              role="switch"
              aria-checked={theme === "dark"}
              className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
                theme === "dark" ? "bg-blue-600" : "bg-slate-300"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                  theme === "dark" ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </span>
          </button>
        )}
      </div>

      {/* User footer */}
      <div className={`border-t border-slate-200 dark:border-slate-800 ${collapsed ? "p-2" : "p-3"}`}>
        <div
          className={`group flex items-center gap-3 rounded-lg transition-colors hover:bg-slate-100 dark:hover:bg-slate-800 ${
            collapsed ? "justify-center px-1 py-2" : "px-2 py-2"
          }`}
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
              <path d="M3 14s-1 0-1-1 1-4 6-4 6 3 6 4-1 1-1 1zm5-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6"/>
            </svg>
          </div>
          {!collapsed && (
            <>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium text-slate-900 dark:text-slate-200">{user.nombre}</p>
                <p className="truncate text-xs capitalize text-slate-500">{user.rol.replace("_", " ")}</p>
              </div>
              <button
                onClick={logout}
                className="text-slate-400 transition-colors hover:text-red-500 dark:text-slate-600 dark:hover:text-red-400"
                title="Cerrar sesión"
              >
                <LogOut size={15} />
              </button>
            </>
          )}
        </div>
        {collapsed && (
          <button
            onClick={logout}
            title="Cerrar sesión"
            className="mt-1 flex w-full justify-center py-2 text-slate-400 transition-colors hover:text-red-500 dark:text-slate-600 dark:hover:text-red-400"
          >
            <LogOut size={15} />
          </button>
        )}
      </div>
    </aside>
  );
}