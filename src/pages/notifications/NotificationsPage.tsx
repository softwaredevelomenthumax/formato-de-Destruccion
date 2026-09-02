import { useNavigate } from "react-router";
import { Bell, CheckCheck, Eye } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useApp } from "../../context/AppContext";
import { EmptyState } from "../../components/ui/EmptyState";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

const TYPE_STYLES = {
  info: { dot: "bg-blue-500", bg: "bg-blue-50 border-blue-200" },
  success: { dot: "bg-green-500", bg: "bg-green-50 border-green-200" },
  warning: { dot: "bg-amber-500", bg: "bg-amber-50 border-amber-200" },
  error: { dot: "bg-red-500", bg: "bg-red-50 border-red-200" },
};

export default function NotificationsPage() {
  const { user } = useAuth();
  const { getUserNotifications, markNotificationRead, markAllNotificationsRead } = useApp();
  const navigate = useNavigate();

  if (!user) return null;

  const notifications = getUserNotifications(user.id);
  const unread = notifications.filter((n) => !n.read).length;

  const handleClick = (n: typeof notifications[0]) => {
    markNotificationRead(n.id);
    if (n.actaId) navigate(`/actas/${n.actaId}`);
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
                    <p className="text-sm text-slate-600 mt-0.5">{n.message || "Sin detalle"}</p>
                    <p className="text-xs text-slate-400 mt-1">
                      {n.createdAt ? formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: es }) : "Hace un momento"}
                    </p>
                  </div>
                  {!n.read && (
                    <button
                      onClick={(e) => { e.stopPropagation(); markNotificationRead(n.id); }}
                      className="shrink-0 p-1 text-slate-400 hover:text-blue-600"
                      title="Marcar como leído"
                    >
                      <Eye size={14} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
