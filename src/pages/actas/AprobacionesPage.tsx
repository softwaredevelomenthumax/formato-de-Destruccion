import { useNavigate } from "react-router";
import { Clock, Eye } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useApp } from "../../context/AppContext";
import { ActaStatusBadge } from "../../components/ui/Badge";
import { EmptyState } from "../../components/ui/EmptyState";
import type { ActaStatus } from "../../types";

export default function AprobacionesPage() {
  const { user } = useAuth();
  const { actas } = useApp();
  const navigate = useNavigate();

  if (!user) return null;

  const statusMap: Partial<Record<string, ActaStatus>> = {
    aprobador_area: "pendiente_aprobacion_area",
    costos: "pendiente_costos",
    hse: "pendiente_hse",
  };

  const targetStatus = statusMap[user.rol];
  const pendingActas = Array.isArray(actas)
    ? actas.filter((a) => a && a.status === targetStatus)
    : [];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Pendientes de Aprobación</h1>
        <p className="text-sm text-slate-500 mt-0.5">{pendingActas.length} acta(s) requieren su revisión</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {pendingActas.length === 0 ? (
          <EmptyState
            icon={<Clock size={48} />}
            title="No hay actas pendientes"
            description="Todas las actas han sido revisadas. Buen trabajo."
          />
        ) : (
          <div className="divide-y divide-slate-100">
            {pendingActas.map((acta) => {
              const safeCosto = Number(acta?.costoDestruccion ?? 0);
              return (
                <div key={acta.id} className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors">
                  <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center shrink-0">
                    <Clock size={18} className="text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-slate-900 font-mono">{acta.consecutivo || "—"}</p>
                      <ActaStatusBadge status={acta.status} />
                    </div>
                    <p className="text-sm text-slate-600 mt-0.5 truncate">{acta.descripcion || "Sin descripción"}</p>
                    <div className="flex gap-4 mt-1 text-xs text-slate-500">
                      <span>Empresa: {acta.empresa || "—"}</span>
                      <span>Solicitante: {acta.solicitanteNombre || "—"}</span>
                      <span>Fecha: {acta.fecha || "—"}</span>
                      <span>COP {safeCosto.toLocaleString("es-CO")}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate(`/actas/${acta.id}`)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-700 text-white text-sm font-medium rounded-lg hover:bg-blue-800 transition-colors shrink-0"
                  >
                    <Eye size={14} /> Revisar
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
