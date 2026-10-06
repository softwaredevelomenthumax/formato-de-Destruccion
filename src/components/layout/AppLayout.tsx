import { Outlet, Navigate, useLocation } from "react-router";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { useAuth } from "../../context/AuthContext";
import { Toaster } from "sonner";
import { useState } from "react";

export function AppLayout() {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.rol === "costos") {
    const path = location.pathname.replace(/\/$/, "") || "/";
    const isActaDetail = /^\/actas\/[^/]+$/.test(path) && path !== "/actas/nueva";
    const canAccess = ["/dashboard", "/perfil", "/actas", "/aprobaciones", "/maestros/cecos"].includes(path) || isActaDetail;
    if (!canAccess) return <Navigate to="/dashboard" replace />;
  }
  return (
    <div className="flex h-screen min-w-0 overflow-hidden bg-slate-50">
      <Sidebar mobileOpen={mobileMenuOpen} onMobileClose={() => setMobileMenuOpen(false)} />
      {mobileMenuOpen && (
        <button
          type="button"
          aria-label="Cerrar menú de navegación"
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/40 md:hidden"
        />
      )}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header onMenuClick={() => setMobileMenuOpen(true)} />
        <main className="min-w-0 flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
      <Toaster position="top-right" richColors />
    </div>
  );
}
