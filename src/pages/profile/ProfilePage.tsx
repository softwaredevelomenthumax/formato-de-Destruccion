import { useMemo, useState } from "react";
import { Mail, MapPin, ShieldCheck, User as UserIcon, Save, X, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router";
import { useAuth } from "../../context/AuthContext";
import { useApp } from "../../context/AppContext";
import { ROLE_LABELS } from "../../constants";
import { toast } from "sonner";

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, updateCurrentUser } = useAuth();
  const { updateUser } = useApp();
  const isSolicitante = user?.rol === "solicitante";
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({
    nombre: user?.nombre ?? "",
    email: user?.email ?? "",
    area: user?.area ?? "",
    password: "",
    confirmPassword: "",
  });

  const roleActions = useMemo(() => {
    if (!user) return [];

    const base = [
      { label: "Dashboard", path: "/dashboard" },
      { label: "Actas", path: "/actas" },
    ];

    if (user.rol === "administrador") {
      return [
        ...base,
        { label: "Usuarios", path: "/usuarios" },
        { label: "Reportes", path: "/reportes" },
      ];
    }

    if (user.rol === "solicitante") {
      return [
        ...base,
        { label: "Búsqueda", path: "/busqueda" },
      ];
    }

    if (user.rol === "aprobador_area") {
      return [
        ...base,
        { label: "Aprobaciones", path: "/aprobaciones" },
        { label: "Reportes", path: "/reportes" },
      ];
    }

    if (user.rol === "costos") {
      return [
        ...base,
        { label: "Aprobaciones", path: "/aprobaciones" },
        { label: "Maestro CeCos", path: "/maestros/cecos" },
      ];
    }

    if (user.rol === "hse") {
      return [
        ...base,
        { label: "Aprobaciones", path: "/aprobaciones" },
        { label: "Reportes", path: "/reportes" },
      ];
    }

    return [
      ...base,
      { label: "Maestro INVIMA", path: "/maestros/invima" },
      { label: "Reportes", path: "/reportes" },
    ];
  }, [user]);

  if (!user) {
    return null;
  }

  const handleSave = async () => {
    if (isSolicitante) {
      toast.error("Los solicitantes no pueden editar la información del perfil");
      return;
    }

    if (form.password || form.confirmPassword) {
      if (form.password.length < 6) {
        toast.error("La contraseña debe tener al menos 6 caracteres");
        return;
      }

      if (form.password !== form.confirmPassword) {
        toast.error("Las contraseñas no coinciden");
        return;
      }
    }

    try {
      const payload: Partial<typeof user> & { password?: string } = {
        nombre: form.nombre,
        email: form.email,
        area: form.area,
      };

      if (form.password) {
        payload.password = form.password;
      }

      await updateUser(user.id, payload);
      updateCurrentUser({
        nombre: form.nombre,
        email: form.email,
        area: form.area,
      });
      toast.success("Perfil actualizado correctamente");
      setIsEditing(false);
      setForm((prev) => ({ ...prev, password: "", confirmPassword: "" }));
    } catch (error) {
      toast.error("No se pudo actualizar el perfil");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-medium text-blue-700">Cuenta</p>
          <h1 className="text-2xl font-bold text-slate-900">Mi perfil</h1>
        </div>
        {!isSolicitante && (
          <button
            onClick={() => setIsEditing((prev) => !prev)}
            className="inline-flex items-center justify-center rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-800"
          >
            {isEditing ? "Cancelar" : "Editar perfil"}
          </button>
        )}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-4 border-b border-slate-200 pb-5">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-xl font-bold text-blue-700">
              {user.nombre.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">{user.nombre}</h2>
              <p className="text-sm text-slate-500">@{user.username}</p>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <div className="flex items-start gap-3 rounded-xl bg-slate-50 p-3">
              <UserIcon className="mt-0.5 h-4 w-4 text-slate-500" />
              <div className="w-full">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Nombre</p>
                {isEditing ? (
                  <input
                    value={form.nombre}
                    onChange={(e) => setForm((prev) => ({ ...prev, nombre: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  />
                ) : (
                  <p className="mt-1 text-sm font-medium text-slate-800">{user.nombre}</p>
                )}
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-xl bg-slate-50 p-3">
              <Mail className="mt-0.5 h-4 w-4 text-slate-500" />
              <div className="w-full">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Correo</p>
                {isEditing ? (
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  />
                ) : (
                  <p className="mt-1 text-sm font-medium text-slate-800">{user.email || "Sin correo registrado"}</p>
                )}
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-xl bg-slate-50 p-3">
              <MapPin className="mt-0.5 h-4 w-4 text-slate-500" />
              <div className="w-full">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Área</p>
                {isEditing ? (
                  <input
                    value={form.area}
                    onChange={(e) => setForm((prev) => ({ ...prev, area: e.target.value }))}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  />
                ) : (
                  <p className="mt-1 text-sm font-medium text-slate-800">{user.area || "Sin área asignada"}</p>
                )}
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-xl bg-slate-50 p-3">
              <ShieldCheck className="mt-0.5 h-4 w-4 text-slate-500" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Rol</p>
                <p className="mt-1 text-sm font-medium text-slate-800">{ROLE_LABELS[user.rol]}</p>
              </div>
            </div>
          </div>

          {!isSolicitante && isEditing ? (
            <div className="mt-6 space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Nueva contraseña</label>
                  <input
                    type="password"
                    value={form.password}
                    onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
                    placeholder="Opcional"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Confirmar contraseña</label>
                  <input
                    type="password"
                    value={form.confirmPassword}
                    onChange={(e) => setForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                    placeholder="Repetir contraseña"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setForm((prev) => ({ ...prev, password: "", confirmPassword: "" }));
                  }}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  <X size={16} />
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800"
                >
                  <Save size={16} />
                  Guardar cambios
                </button>
              </div>
            </div>
          ) : null}
        </section>

        <aside className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900">Accesos rápidos</h3>
            <div className="mt-4 space-y-2">
              {roleActions.map((action) => (
                <button
                  key={action.path}
                  onClick={() => navigate(action.path)}
                  className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-left text-sm font-medium text-slate-700 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                >
                  {action.label}
                  <ArrowRight size={15} />
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900">Estado</h3>
            <div className="mt-4 rounded-xl bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
              Cuenta activa
            </div>
            <p className="mt-3 text-sm text-slate-500">
              El perfil actualiza la información visible de tu usuario y sus accesos principales dentro del sistema.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
