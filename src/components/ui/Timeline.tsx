import { CheckCircle2, XCircle, Clock, RotateCcw, MinusCircle } from "lucide-react";
import type { ActaAprobacion } from "../../types";

const PASO_LABELS = { area: "Aprobación de Área", costos: "Revisión de Costos", hse: "Aprobación HSE & S" };

interface TimelineProps {
  aprobaciones: ActaAprobacion[];
}

export function ApprovalTimeline({ aprobaciones }: TimelineProps) {
  return (
    <div className="space-y-0">
      {aprobaciones.map((ap, i) => {
        const isLast = i === aprobaciones.length - 1;
        return (
          <div key={ap.paso} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                ap.status === "aprobado" ? "bg-green-50 text-green-600" :
                ap.status === "rechazado" ? "bg-red-50 text-red-600" :
                ap.status === "devuelto" ? "bg-amber-50 text-amber-600" :
                ap.status === "no_aplica" ? "bg-slate-50 text-slate-400" :
                "bg-blue-50 text-blue-500"
              }`}>
                {ap.status === "aprobado" ? <CheckCircle2 size={18} /> :
                 ap.status === "rechazado" ? <XCircle size={18} /> :
                 ap.status === "devuelto" ? <RotateCcw size={16} /> :
                 ap.status === "no_aplica" ? <MinusCircle size={16} /> :
                 <Clock size={16} />}
              </div>
              {!isLast && <div className="w-0.5 h-full min-h-8 bg-slate-200 mt-1" />}
            </div>
            <div className="pb-6 min-w-0">
              <p className="text-sm font-semibold text-slate-800">{PASO_LABELS[ap.paso]}</p>
              <p className={`text-xs font-medium mt-0.5 ${
                ap.status === "aprobado" ? "text-green-600" :
                ap.status === "rechazado" ? "text-red-600" :
                ap.status === "devuelto" ? "text-amber-600" :
                ap.status === "no_aplica" ? "text-slate-400" :
                "text-blue-600"
              }`}>
                {ap.status === "aprobado" ? "Aprobado" :
                 ap.status === "rechazado" ? "Rechazado" :
                 ap.status === "devuelto" ? "Devuelto para ajustes" :
                 ap.status === "no_aplica" ? "No aplica" :
                 "Pendiente"}
              </p>
              {ap.aprobador && <p className="text-xs text-slate-500 mt-0.5">Por: {ap.aprobador} · {ap.fechaAprobacion ? new Date(ap.fechaAprobacion).toLocaleDateString("es-CO") : ""}</p>}
              {ap.comentario && <p className="text-xs text-slate-600 mt-1 bg-slate-50 rounded px-2 py-1">{ap.comentario}</p>}
              {ap.motivoRechazo && <p className="text-xs text-red-700 mt-1 bg-red-50 rounded px-2 py-1">{ap.motivoRechazo}</p>}
              {ap.ajustes && ap.ajustes.length > 0 && (
                <div className="mt-1 space-y-1">
                  {ap.ajustes.map((aj, j) => (
                    <div key={j} className="text-xs bg-amber-50 rounded px-2 py-1.5 border border-amber-200">
                      <p className="font-medium text-amber-800">{aj.campo}: {aj.correccion}</p>
                      {aj.comentario && <p className="text-amber-700 mt-0.5">{aj.comentario}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
