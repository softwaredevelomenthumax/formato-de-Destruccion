import { useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { Bell, Search, ChevronRight, Menu } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useApp } from "../../context/AppContext";

const BREADCRUMB_MAP: Record<string, string> = {
  dashboard: "Dashboard",
  actas: "Actas de Destrucción",
  nueva: "Nueva Acta",
  usuarios: "Gestión de Usuarios",
  maestros: "Maestros",
  cecos: "Centros de Costos",
  invima: "Maestro Unificado de Materiales",
  reportes: "Reportes",
  busqueda: "Búsqueda Global",
  notificaciones: "Notificaciones",
  aprobaciones: "Pendientes de Aprobación",
};

interface HeaderProps {
  onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { user } = useAuth();
  const { getUserNotifications } = useApp();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  if (!user) return null;

  const unread = getUserNotifications(user.id).filter((n) => !n.read).length;

  const segments = location.pathname.split("/").filter(Boolean);
  const crumbs = segments.map((seg, i) => ({
    label: BREADCRUMB_MAP[seg] || seg,
    path: "/" + segments.slice(0, i + 1).join("/"),
  }));

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/busqueda?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
    }
  };

  return (
    <header className="flex h-16 shrink-0 items-center gap-3 border-b border-slate-200/80 bg-white/90 px-3 shadow-[0_1px_12px_rgba(15,23,42,0.03)] backdrop-blur-md sm:gap-4 sm:px-6">
      <button
        type="button"
        onClick={onMenuClick}
        className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 md:hidden"
        title="Abrir menú"
        aria-label="Abrir menú de navegación"
      >
        <Menu size={19} />
      </button>
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1 flex-1 min-w-0">
        {crumbs.map((crumb, i) => (
          <div key={crumb.path} className="flex items-center gap-1">
            {i > 0 && <ChevronRight size={12} className="text-slate-400" />}
            <span
              className={`text-sm ${i === crumbs.length - 1 ? "font-semibold text-slate-800" : "text-slate-500 hover:text-slate-700 cursor-pointer"}`}
              onClick={() => i < crumbs.length - 1 && navigate(crumb.path)}
            >
              {crumb.label}
            </span>
          </div>
        ))}
      </nav>

      {/* Search bar */}
      <form onSubmit={handleSearch} className="relative hidden md:block">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar actas, usuarios..."
          className="pl-8 pr-4 py-1.5 text-sm bg-slate-100 border border-transparent rounded-lg focus:outline-none focus:border-blue-300 focus:bg-white transition-all w-56 focus:w-72 placeholder:text-slate-400"
        />
      </form>

      {/* Notifications */}
      <button
        onClick={() => navigate("/notificaciones")}
        className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
        title="Notificaciones"
      >
        <Bell size={18} />
        {unread > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[9px] rounded-full flex items-center justify-center font-bold">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
    </header>
  );
}
