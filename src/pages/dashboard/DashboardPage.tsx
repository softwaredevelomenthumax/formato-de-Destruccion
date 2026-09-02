import { useNavigate } from "react-router";
import {
  FileText, Clock, CheckCircle, XCircle, Users, AlertTriangle,
  TrendingUp, Activity
} from "lucide-react";
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, LineChart, Line, Legend
} from "recharts";
import { useAuth } from "../../context/AuthContext";
import { useApp } from "../../context/AppContext";
import { StatCard } from "../../components/ui/StatCard";
import { ActaStatusBadge } from "../../components/ui/Badge";
import { ROLE_LABELS } from "../../constants";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const COLORS = ["#1D4ED8", "#16A34A", "#D97706", "#DC2626", "#7C3AED", "#0284C7"];

function buildMonthlyData(actas: ReturnType<typeof useApp>["actas"]) {
  const months: Record<string, number> = {};
  actas.forEach((a) => {
    const key = format(new Date(a.createdAt), "MMM", { locale: es });
    months[key] = (months[key] || 0) + 1;
  });
  return Object.entries(months).map(([mes, total]) => ({ mes, total })).slice(-6);
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { actas, users, solicitudes, getUserNotifications } = useApp();
  const navigate = useNavigate();

  if (!user) return null;

  const myActas = actas.filter((a) => a.solicitanteId === user.id);
  const unread = getUserNotifications(user.id).filter((n) => !n.read).length;

  // Admin dashboard
  if (user.rol === "administrador") {
    const pendingSol = solicitudes.filter((s) => s.status === "pendiente").length;
    const actasByStatus = [
      { name: "Borrador", value: actas.filter((a) => a.status === "borrador").length, color: "#94A3B8" },
      { name: "En Proceso", value: actas.filter((a) => ["enviada", "pendiente_aprobacion_area", "pendiente_costos", "pendiente_hse"].includes(a.status)).length, color: "#D97706" },
      { name: "Aprobadas", value: actas.filter((a) => a.status === "aprobada").length, color: "#16A34A" },
      { name: "Rechazadas", value: actas.filter((a) => a.status === "rechazada").length, color: "#DC2626" },
      { name: "Devueltas", value: actas.filter((a) => a.status === "devuelta_ajustes").length, color: "#F59E0B" },
    ].filter((d) => d.value > 0);

    const empresaData = [
      { name: "Humax", value: actas.filter((a) => a.empresa === "Humax").length },
      { name: "Farmatech", value: actas.filter((a) => a.empresa === "Farmatech").length },
      { name: "Cambridge", value: actas.filter((a) => a.empresa === "Cambridge").length },
    ].filter((d) => d.value > 0);

    const monthlyData = buildMonthlyData(actas);
    const recentActas = [...actas].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).slice(0, 5);

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Dashboard Administrativo</h1>
          <p className="text-sm text-slate-500 mt-0.5">Bienvenido, {user.nombre}</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Solicitudes Pendientes" value={pendingSol} icon={<Users size={20} />} iconColor="bg-amber-50 text-amber-600"
            onClick={() => navigate("/usuarios")} delta={pendingSol > 0 ? `${pendingSol} por aprobar` : undefined} />
          <StatCard label="Actas en Proceso" value={actas.filter((a) => ["pendiente_aprobacion_area", "pendiente_costos", "pendiente_hse"].includes(a.status)).length}
            icon={<Clock size={20} />} iconColor="bg-blue-50 text-blue-700" onClick={() => navigate("/actas")} />
          <StatCard label="Actas Aprobadas" value={actas.filter((a) => a.status === "aprobada").length}
            icon={<CheckCircle size={20} />} iconColor="bg-green-50 text-green-700" onClick={() => navigate("/actas")} />
          <StatCard label="Total Usuarios" value={users.filter((u) => u.status === "activo").length}
            icon={<Users size={20} />} iconColor="bg-purple-50 text-purple-700" onClick={() => navigate("/usuarios")} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5 lg:col-span-2">
            <h2 className="text-sm font-semibold text-slate-700 mb-4">Actas por mes</h2>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="total" fill="#1D4ED8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5">
            <h2 className="text-sm font-semibold text-slate-700 mb-4">Por empresa</h2>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={empresaData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label={({ name, value }) => `${name}: ${value}`}>
                  {empresaData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
            <h2 className="text-sm font-semibold text-slate-700">Actividad reciente</h2>
            <button onClick={() => navigate("/actas")} className="text-xs text-blue-700 hover:text-blue-900 font-medium">Ver todas</button>
          </div>
          <div className="divide-y divide-slate-100">
            {recentActas.map((acta) => (
              <div key={acta.id} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 cursor-pointer transition-colors" onClick={() => navigate(`/actas/${acta.id}`)}>
                <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
                  <FileText size={15} className="text-blue-700" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{acta.consecutivo}</p>
                  <p className="text-xs text-slate-500 truncate">{acta.descripcion}</p>
                </div>
                <ActaStatusBadge status={acta.status} />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Solicitante dashboard
  if (user.rol === "solicitante") {
    const borradores = myActas.filter((a) => a.status === "borrador").length;
    const pendientes = myActas.filter((a) => ["pendiente_aprobacion_area", "pendiente_costos", "pendiente_hse", "enviada"].includes(a.status)).length;
    const rechazadas = myActas.filter((a) => a.status === "rechazada").length;
    const aprobadas = myActas.filter((a) => a.status === "aprobada").length;
    const devueltas = myActas.filter((a) => a.status === "devuelta_ajustes").length;

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Mis Actas de Destrucción</h1>
            <p className="text-sm text-slate-500 mt-0.5">Bienvenido, {user.nombre}</p>
          </div>
        </div>

        {devueltas > 0 && (
          <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
            <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-800">Tienes {devueltas} acta(s) devuelta(s) para corrección</p>
              <p className="text-xs text-amber-700 mt-0.5">Revise los comentarios del aprobador y realice las correcciones.</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Borradores" value={borradores} icon={<FileText size={20} />} iconColor="bg-slate-100 text-slate-500" onClick={() => navigate("/actas")} />
          <StatCard label="En Aprobación" value={pendientes} icon={<Clock size={20} />} iconColor="bg-blue-50 text-blue-700" onClick={() => navigate("/actas")} />
          <StatCard label="Aprobadas" value={aprobadas} icon={<CheckCircle size={20} />} iconColor="bg-green-50 text-green-700" onClick={() => navigate("/actas")} />
          <StatCard label="Rechazadas" value={rechazadas} icon={<XCircle size={20} />} iconColor="bg-red-50 text-red-600" onClick={() => navigate("/actas")} />
        </div>

        <div className="bg-white rounded-xl border border-slate-200">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
            <h2 className="text-sm font-semibold text-slate-700">Actas recientes</h2>
            <button onClick={() => navigate("/actas")} className="text-xs text-blue-700 font-medium">Ver todas</button>
          </div>
          {myActas.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <FileText size={36} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">No ha creado ningún acta aún</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {[...myActas].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).slice(0, 6).map((acta) => (
                <div key={acta.id} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 cursor-pointer" onClick={() => navigate(`/actas/${acta.id}`)}>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800">{acta.consecutivo}</p>
                    <p className="text-xs text-slate-500 truncate">{acta.descripcion} — {acta.empresa}</p>
                  </div>
                  <ActaStatusBadge status={acta.status} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Aprobador / Costos / HSE / Planeación dashboard
  const pendingApproval = actas.filter((a) => {
    if (user.rol === "aprobador_area") return a.status === "pendiente_aprobacion_area";
    if (user.rol === "costos") return a.status === "pendiente_costos";
    if (user.rol === "hse") return a.status === "pendiente_hse";
    return false;
  });

  const myApproved = actas.filter((a) =>
    a.aprobaciones?.some((ap) => ap.aprobador === user.username && ap.status === "aprobado") ?? false
  );
  const myRejected = actas.filter((a) =>
    a.aprobaciones?.some((ap) => ap.aprobador === user.username && ap.status === "rechazado") ?? false
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Dashboard — {ROLE_LABELS[user.rol]}</h1>
        <p className="text-sm text-slate-500 mt-0.5">Bienvenido, {user.nombre}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <StatCard label="Pendientes de Aprobación" value={pendingApproval.length}
          icon={<Clock size={20} />} iconColor={pendingApproval.length > 0 ? "bg-amber-50 text-amber-600" : "bg-slate-50 text-slate-400"}
          delta={pendingApproval.length > 0 ? "Requieren atención" : undefined}
          onClick={() => navigate("/aprobaciones")} />
        <StatCard label="Aprobadas por mí" value={myApproved.length} icon={<CheckCircle size={20} />} iconColor="bg-green-50 text-green-700" onClick={() => navigate("/actas")} />
        <StatCard label="Rechazadas por mí" value={myRejected.length} icon={<XCircle size={20} />} iconColor="bg-red-50 text-red-600" onClick={() => navigate("/actas")} />
      </div>

      <div className="bg-white rounded-xl border border-slate-200">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <h2 className="text-sm font-semibold text-slate-700">Solicitudes pendientes de mi revisión</h2>
          <button onClick={() => navigate("/aprobaciones")} className="text-xs text-blue-700 font-medium">Ver todas</button>
        </div>
        {pendingApproval.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <CheckCircle size={36} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">No hay actas pendientes de su revisión</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {pendingApproval.slice(0, 5).map((acta) => (
              <div key={acta.id} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 cursor-pointer" onClick={() => navigate(`/actas/${acta.id}`)}>
                <div className="w-8 h-8 bg-amber-50 rounded-lg flex items-center justify-center shrink-0">
                  <Clock size={15} className="text-amber-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800">{acta.consecutivo}</p>
                  <p className="text-xs text-slate-500 truncate">{acta.descripcion} · {acta.solicitanteNombre}</p>
                </div>
                <ActaStatusBadge status={acta.status} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
