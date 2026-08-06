import { useState } from "react";
import { useParams, useNavigate } from "react-router";
import {
  ArrowLeft, CheckCircle2, XCircle, RotateCcw, Send, Edit2,
  FileText, History, Clock, Plus, Trash2
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useApp } from "../../context/AppContext";
import { ActaStatusBadge } from "../../components/ui/Badge";
import { ApprovalTimeline } from "../../components/ui/Timeline";
import { Modal, ConfirmModal } from "../../components/ui/Modal";
import { CAUSAL_LABELS, CLASIFICACION_LABELS, CAUSAL_DEVOLUCION_OPTIONS } from "../../constants";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import type { AjusteField } from "../../types";

export default function ActaDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const { actas, approveActa, rejectActa, returnActa, sendActa } = useApp();
  const navigate = useNavigate();

  const [showApprove, setShowApprove] = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [showReturn, setShowReturn] = useState(false);
  const [approveComment, setApproveComment] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [returnCausal, setReturnCausal] = useState("");
  const [ajustes, setAjustes] = useState<AjusteField[]>([{ campo: "", correccion: "", comentario: "" }]);

  const acta = actas.find((a) => a.id === id);

  if (!acta) return (
    <div className="text-center py-20">
      <p className="text-slate-500">Acta no encontrada</p>
      <button onClick={() => navigate("/actas")} className="mt-4 text-blue-700 text-sm">Volver a la lista</button>
    </div>
  );

  if (!user) return null;

  const getPasoForRole = () => {
    if (user.rol === "aprobador_area") return "area" as const;
    if (user.rol === "costos") return "costos" as const;
    if (user.rol === "hse") return "hse" as const;
    return null;
  };

  const paso = getPasoForRole();
  const canApprove = paso && acta.status === `pendiente_${paso === "area" ? "aprobacion_area" : paso}` && acta.solicitanteId !== user.id;
  const canEdit = user.rol === "solicitante" && acta.solicitanteId === user.id && acta.status === "devuelta_ajustes";
  const canSend = user.rol === "solicitante" && acta.solicitanteId === user.id && acta.status === "borrador";

  const handleApprove = () => {
    if (!paso) return;
    approveActa(acta.id, paso, user.username, approveComment);
    toast.success("Acta aprobada exitosamente");
    setShowApprove(false);
    setApproveComment("");
  };

  const handleReject = () => {
    if (!paso || !rejectReason.trim()) { toast.error("El motivo de rechazo es obligatorio"); return; }
    rejectActa(acta.id, paso, user.username, rejectReason);
    toast.success("Acta rechazada");
    setShowReject(false);
    setRejectReason("");
  };

  const handleReturn = () => {
    if (!paso) return;
    const validAjustes = ajustes.filter((a) => a.campo && a.correccion);
    if (validAjustes.length === 0) { toast.error("Debe indicar al menos un ajuste requerido"); return; }
    returnActa(acta.id, paso, user.username, validAjustes);
    toast.success("Acta devuelta para correcciones");
    setShowReturn(false);
  };

  const handleSend = () => {
    sendActa(acta.id, user.id, user.nombre);
    toast.success("Acta enviada a aprobación");
  };

  const addAjuste = () => setAjustes((prev) => [...prev, { campo: "", correccion: "", comentario: "" }]);
  const updateAjuste = (i: number, field: keyof AjusteField, value: string) => {
    setAjustes((prev) => prev.map((a, idx) => idx === i ? { ...a, [field]: value } : a));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-start gap-4">
        <button onClick={() => navigate(-1)} className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg mt-0.5">
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl font-bold text-slate-900 font-mono">{acta.consecutivo}</h1>
            <ActaStatusBadge status={acta.status} />
            {acta.sustanciaControlada && (
              <span className="px-2 py-0.5 text-xs font-medium bg-red-50 text-red-700 border border-red-200 rounded-full">
                Sustancia Controlada
              </span>
            )}
          </div>
          <p className="text-sm text-slate-500 mt-0.5">{acta.descripcion}</p>
        </div>
        <div className="flex gap-2 shrink-0">
          {canEdit && (
            <button onClick={() => navigate(`/actas/${acta.id}/editar`)} className="flex items-center gap-2 px-4 py-2 text-sm font-medium border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50">
              <Edit2 size={14} /> Corregir
            </button>
          )}
          {canSend && (
            <button onClick={handleSend} className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-blue-700 text-white rounded-lg hover:bg-blue-800">
              <Send size={14} /> Enviar
            </button>
          )}
          {canApprove && (
            <div className="flex gap-2">
              <button onClick={() => setShowReturn(true)} className="flex items-center gap-2 px-3 py-2 text-sm font-medium border border-amber-300 text-amber-700 rounded-lg hover:bg-amber-50">
                <RotateCcw size={14} /> Devolver
              </button>
              <button onClick={() => setShowReject(true)} className="flex items-center gap-2 px-3 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700">
                <XCircle size={14} /> Rechazar
              </button>
              <button onClick={() => setShowApprove(true)} className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-green-600 text-white rounded-lg hover:bg-green-700">
                <CheckCircle2 size={14} /> Aprobar
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Main info */}
        <div className="lg:col-span-2 space-y-4">
          <InfoCard title="Información General">
            <Grid2>
              <Row label="Empresa" value={acta.empresa} />
              <Row label="Centro de Costos" value={acta.centroCostos} />
              <Row label="Fecha" value={acta.fecha} />
              <Row label="Solicitante" value={acta.solicitanteNombre} />
              <Row label="Responsable" value={acta.responsable} />
              <Row label="Área" value={acta.area} />
            </Grid2>
          </InfoCard>

          <InfoCard title="Información del Material">
            <Grid2>
              <Row label="Descripción" value={acta.descripcion} className="col-span-2" />
              <Row label="Código SAP" value={acta.codigoSAP} />
              <Row label="Registro INVIMA" value={acta.registroINVIMA} />
              <Row label="Número de Lote" value={acta.numeroLote} />
              <Row label="Orden de Producción" value={acta.ordenProduccion} />
              <Row label="Clasificación" value={CLASIFICACION_LABELS[acta.clasificacion]} />
              <Row label="Fecha Vencimiento" value={acta.fechaVencimiento} />
              <Row label="Sustancia Controlada" value={acta.sustanciaControlada ? "Sí" : "No"} />
            </Grid2>
          </InfoCard>

          <InfoCard title="Información Económica">
            <Grid2>
              <Row label="Peso (kg)" value={`${acta.pesoKg} kg`} />
              <Row label="Unidades" value={String(acta.cantidadUnidades)} />
              <Row label="Costo Destrucción" value={`COP ${acta.costoDestruccion.toLocaleString("es-CO")}`} />
              <Row label="Requiere Costos" value={acta.requiereCostos ? "Sí" : "No"} />
            </Grid2>
          </InfoCard>

          <InfoCard title="Causal de Destrucción">
            <Row label="Causal" value={CAUSAL_LABELS[acta.causal]} />
            {acta.otraCausal && <Row label="Especificación" value={acta.otraCausal} />}
          </InfoCard>

          {acta.observaciones && (
            <InfoCard title="Observaciones">
              <p className="text-sm text-slate-700">{acta.observaciones}</p>
            </InfoCard>
          )}

          {acta.adjuntos.length > 0 && (
            <InfoCard title="Documentos Adjuntos">
              <div className="space-y-1.5">
                {acta.adjuntos.map((adj, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-blue-700 hover:text-blue-900 cursor-pointer">
                    <FileText size={14} />
                    <span className="underline">{adj}</span>
                  </div>
                ))}
              </div>
            </InfoCard>
          )}

          {/* History */}
          <InfoCard title="Historial de Cambios">
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {acta.historial.map((h) => (
                <div key={h.id} className="flex items-start gap-3 text-sm py-1.5 border-b border-slate-100 last:border-0">
                  <div className="text-xs text-slate-500 shrink-0 w-28">{h.fecha} {h.hora}</div>
                  <div className="flex-1 min-w-0">
                    <span className="font-medium text-slate-700">{h.usuario}</span>
                    <span className="text-slate-500 mx-1">·</span>
                    <span className="text-slate-600">{h.accion}</span>
                    {h.campo && (
                      <p className="text-xs text-slate-400 mt-0.5">{h.campo}: {h.valorAnterior} → {h.valorNuevo}</p>
                    )}
                  </div>
                  <div className="text-xs text-slate-400">{h.equipo}</div>
                </div>
              ))}
            </div>
          </InfoCard>
        </div>

        {/* Sidebar: Approval timeline */}
        <div className="space-y-4">
          <InfoCard title="Flujo de Aprobación">
            <ApprovalTimeline aprobaciones={acta.aprobaciones} />
          </InfoCard>
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-2">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Metadatos</p>
            <div className="space-y-1">
              <Row label="Creado" value={format(new Date(acta.createdAt), "dd/MM/yyyy HH:mm", { locale: es })} />
              <Row label="Actualizado" value={format(new Date(acta.updatedAt), "dd/MM/yyyy HH:mm", { locale: es })} />
              <Row label="ID" value={acta.id} />
            </div>
          </div>
        </div>
      </div>

      {/* Approve modal */}
      <Modal open={showApprove} onClose={() => setShowApprove(false)} title="Aprobar Acta" size="sm"
        footer={
          <>
            <button onClick={() => setShowApprove(false)} className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900 font-medium rounded-lg hover:bg-slate-100">Cancelar</button>
            <button onClick={handleApprove} className="px-5 py-2 text-sm font-semibold bg-green-600 text-white rounded-lg hover:bg-green-700">Aprobar</button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-slate-600">¿Confirma la aprobación del acta <strong>{acta.consecutivo}</strong>?</p>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Comentario (opcional)</label>
            <textarea value={approveComment} onChange={(e) => setApproveComment(e.target.value)} rows={3}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Observaciones de la aprobación..." />
          </div>
        </div>
      </Modal>

      {/* Reject modal */}
      <Modal open={showReject} onClose={() => setShowReject(false)} title="Rechazar Acta" size="sm"
        footer={
          <>
            <button onClick={() => setShowReject(false)} className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900 font-medium rounded-lg hover:bg-slate-100">Cancelar</button>
            <button onClick={handleReject} className="px-5 py-2 text-sm font-semibold bg-red-600 text-white rounded-lg hover:bg-red-700">Rechazar</button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-slate-600">Indique el motivo de rechazo. Esta información será notificada al solicitante.</p>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Motivo de rechazo *</label>
            <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} rows={4}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
              placeholder="Explique detalladamente el motivo del rechazo..." />
          </div>
        </div>
      </Modal>

      {/* Return modal */}
      <Modal open={showReturn} onClose={() => setShowReturn(false)} title="Devolver para Ajustes" size="lg"
        footer={
          <>
            <button onClick={() => setShowReturn(false)} className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900 font-medium rounded-lg hover:bg-slate-100">Cancelar</button>
            <button onClick={handleReturn} className="px-5 py-2 text-sm font-semibold bg-amber-600 text-white rounded-lg hover:bg-amber-700">Devolver</button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">Especifique los campos que requieren corrección. El solicitante recibirá esta información.</p>
          {ajustes.map((ajuste, i) => (
            <div key={i} className="border border-slate-200 rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-500">Ajuste {i + 1}</p>
                {ajustes.length > 1 && (
                  <button onClick={() => setAjustes((prev) => prev.filter((_, j) => j !== i))} className="text-slate-400 hover:text-red-500">
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
              <select
                value={ajuste.campo}
                onChange={(e) => updateAjuste(i, "campo", e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white"
              >
                <option value="">Seleccione el campo</option>
                {CAUSAL_DEVOLUCION_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
              <input
                value={ajuste.correccion}
                onChange={(e) => updateAjuste(i, "correccion", e.target.value)}
                placeholder="Corrección requerida"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <textarea
                value={ajuste.comentario}
                onChange={(e) => updateAjuste(i, "comentario", e.target.value)}
                placeholder="Comentario adicional (opcional)"
                rows={2}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          ))}
          <button onClick={addAjuste} className="flex items-center gap-1.5 text-sm text-blue-700 hover:text-blue-900 font-medium">
            <Plus size={14} /> Agregar otro ajuste
          </button>
        </div>
      </Modal>
    </div>
  );
}

function InfoCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="px-5 py-3 border-b border-slate-200 bg-slate-50">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{title}</p>
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  );
}

function Grid2({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-x-4 gap-y-2">{children}</div>;
}

function Row({ label, value, className = "" }: { label: string; value: string; className?: string }) {
  return (
    <div className={`${className}`}>
      <p className="text-xs text-slate-500 font-medium">{label}</p>
      <p className="text-sm text-slate-800 mt-0.5">{value || "—"}</p>
    </div>
  );
}
