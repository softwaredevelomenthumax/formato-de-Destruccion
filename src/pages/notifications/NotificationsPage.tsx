import { useState } from "react";
import { useNavigate } from "react-router";
import { Bell, CheckCheck, Eye, Trash2 } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useApp } from "../../context/AppContext";
import { EmptyState } from "../../components/ui/EmptyState";
import { Modal } from "../../components/ui/Modal";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";

const TYPE_STYLES = {
  info: { dot: "bg-blue-500", bg: "bg-blue-50 border-blue-200" },
  success: { dot: "bg-green-500", bg: "bg-green-50 border-green-200" },
  warning: { dot: "bg-amber-500", bg: "bg-amber-50 border-amber-200" },
  error: { dot: "bg-red-500", bg: "bg-red-50 border-red-200" },
};

export default function NotificationsPage() {
  const { user } = useAuth();
  const { actas, getUserNotifications, markNotificationRead, deleteNotification, markAllNotificationsRead } = useApp();
  const navigate = useNavigate();
  const [selectedNotification, setSelectedNotification] = useState<typeof notifications[0] | null>(null);

  if (!user) return null;

  const notifications = getUserNotifications(user.id);
  const unread = notifications.filter((n) => !n.read).length;
  const selectedActa = selectedNotification?.actaId
    ? actas.find((acta) => acta.id === selectedNotification.actaId)
    : undefined;

  const handleClick = (n: typeof notifications[0]) => {
    markNotificationRead(n.id);
    setSelectedNotification(n);
  };

  const getMessage = (notification: typeof notifications[0]) => {
    if (notification.message?.trim()) return notification.message;
    if (notification.title?.toLowerCase().includes("rechaz")) return "El acta fue rechazada. Revisa el motivo indicado por el aprobador.";
    if (notification.title?.toLowerCase().includes("devuelta")) return "El acta fue devuelta para realizar correcciones.";
    if (notification.title?.toLowerCase().includes("aprob")) return "El acta requiere tu revisión y decisión en la bandeja de aprobaciones.";
    return "Tienes una actualización relacionada con la gestión de actas.";
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteNotification(id);
      if (selectedNotification?.id === id) setSelectedNotification(null);
      toast.success("Notificación eliminada");
    } catch {
      toast.error("No se pudo eliminar la notificación");
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Notificaciones</h1>
          <p className="text-sm text-slate-500 mt-0.5">{unread} sin leer</p>
        </div>
        {unread > 0 && (
          <button
            onClick={() => markAllNotificationsRead(user.id)}
            className="flex items-center gap-2 text-sm text-blue-700 hover:text-blue-900 font-medium border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-50"
          >
            <CheckCheck size={15} /> Marcar todo como leído
          </button>
        )}
      </div>

      <Modal
        open={!!selectedNotification}
        onClose={() => setSelectedNotification(null)}
        title={selectedNotification?.title || "Detalle de notificación"}
        size="md"
        footer={
          <>
            <button onClick={() => setSelectedNotification(null)} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg">Cerrar</button>
            {selectedNotification?.actaId && (
              <button onClick={() => { navigate(`/actas/${selectedNotification.actaId}`); setSelectedNotification(null); }} className="px-4 py-2 text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 rounded-lg">Ver acta</button>
            )}
          </>
        }
      >
        {selectedNotification && (
          <div className="space-y-4">
            <div className={`rounded-lg border px-4 py-3 ${TYPE_STYLES[selectedNotification.type]?.bg || TYPE_STYLES.info.bg}`}>
              <p className="text-sm font-semibold text-slate-800">{getMessage(selectedNotification)}</p>
            </div>
            {selectedNotification.actaId && (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
                <p><span className="font-semibold">Acta:</span> {selectedActa?.consecutivo || selectedNotification.actaId}</p>
                {selectedActa && <p className="mt-1"><span className="font-semibold">Estado:</span> {selectedActa.status}</p>}
                {selectedActa?.descripcion && <p className="mt-1"><span className="font-semibold">Material:</span> {selectedActa.descripcion}</p>}
                <p className="mt-2 font-semibold text-blue-700">Requiere revisar la información y decidir si se aprueba, rechaza o devuelve para ajustes.</p>
              </div>
            )}
            <p className="text-xs text-slate-400">{selectedNotification.createdAt ? formatDistanceToNow(new Date(selectedNotification.createdAt), { addSuffix: true, locale: es }) : "Hace un momento"}</p>
          </div>
        )}
      </Modal>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {notifications.length === 0 ? (
          <EmptyState
            icon={<Bell size={48} />}
            title="Sin notificaciones"
            description="Aquí aparecerán las notificaciones sobre sus actas y accesos"
          />
        ) : (
          <div className="divide-y divide-slate-100">
            {notifications.map((n) => {
              const typeKey = n?.type && TYPE_STYLES[n.type] ? n.type : "info";
              const styles = TYPE_STYLES[typeKey];
              return (
                <div
                  key={n.id}
                  className={`flex items-start gap-4 px-5 py-4 cursor-pointer transition-colors ${!n.read ? "bg-blue-50/40" : "hover:bg-slate-50"}`}
                  onClick={() => handleClick(n)}
                >
                  <div className={`w-2.5 h-2.5 rounded-full shrink-0 mt-1.5 ${n.read ? "bg-slate-300" : styles.dot}`} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold ${n.read ? "text-slate-600" : "text-slate-900"}`}>{n.title || "Notificación"}</p>
                    <p className="text-sm text-slate-600 mt-0.5">{getMessage(n)}</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {n.createdAt ? formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: es }) : "Hace un momento"}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    {!n.read && <button onClick={(e) => { e.stopPropagation(); markNotificationRead(n.id); }} className="p-1 text-slate-400 hover:text-blue-600" title="Marcar como leído"><Eye size={14} /></button>}
                    <button onClick={(e) => { e.stopPropagation(); handleDelete(n.id); }} className="p-1 text-slate-400 hover:text-red-600" title="Eliminar notificación"><Trash2 size={14} /></button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
