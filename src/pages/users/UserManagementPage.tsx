import { useState } from "react";
import { Users, Search, UserPlus, CheckCircle, XCircle, Edit2, Trash2, ToggleLeft, ToggleRight, Key, Mail } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { api } from "../../services/api";
import { Modal, ConfirmModal } from "../../components/ui/Modal";
import { Badge } from "../../components/ui/Badge";
import { EmptyState } from "../../components/ui/EmptyState";
import { ROLE_LABELS, AREAS } from "../../constants";
import type { Role, UserStatus, User } from "../../types";
import { toast } from "sonner";

const STATUS_BADGE: Record<UserStatus, { label: string; variant: "success" | "warning" | "error" | "muted" }> = {
  activo: { label: "Activo", variant: "success" },
  inactivo: { label: "Inactivo", variant: "muted" },
  pendiente: { label: "Pendiente", variant: "warning" },
  rechazado: { label: "Rechazado", variant: "error" },
};

export default function UserManagementPage() {
  const { users, solicitudes, updateUser, deleteUser, createUser, approveSolicitud, rejectSolicitud } = useApp();

  const [search, setSearch] = useState("");
  const [rolFilter, setRolFilter] = useState<Role | "">("");
  const [statusFilter, setStatusFilter] = useState<UserStatus | "">("");
  const [tab, setTab] = useState<"users" | "requests">("users");
  const [editUser, setEditUser] = useState<User | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const [form, setForm] = useState({ nombre: "", username: "", password: "Humax2024*", area: "", rol: "solicitante" as Role, email: "", status: "activo" as UserStatus });

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    const matchSearch = !q || u.username.toLowerCase().includes(q) || u.nombre.toLowerCase().includes(q) || (u.email || "").toLowerCase().includes(q) || u.area.toLowerCase().includes(q);
    return matchSearch && (!rolFilter || u.rol === rolFilter) && (!statusFilter || u.status === statusFilter);
  });

  const pendingSolicitudes = solicitudes.filter((s) => s.status === "pendiente");

  const handleSaveUser = async () => {
    if (!form.nombre || !form.username || !form.area) { toast.error("Complete todos los campos obligatorios"); return; }
    if (editUser) {
      await updateUser(editUser.id, { nombre: form.nombre, area: form.area, rol: form.rol, email: form.email, status: form.status });
      toast.success("Usuario actualizado");
    } else {
      await createUser({ username: form.username, password: form.password, nombre: form.nombre, area: form.area, rol: form.rol, email: form.email || undefined, status: form.status });
      toast.success("Usuario creado. Contraseña: " + form.password);
    }
    setEditUser(null);
    setCreateModalOpen(false);
    setForm({ nombre: "", username: "", password: "Humax2024*", area: "", rol: "solicitante", email: "", status: "activo" });
  };

  const handleDelete = (id: string) => {
    const ok = deleteUser(id);
    if (ok) toast.success("Usuario eliminado");
    else toast.error("No se puede eliminar: el usuario tiene actas activas");
    setDeleteConfirm(null);
  };

  const openEdit = (u: User) => {
    setEditUser(u);
    setForm({ nombre: u.nombre, username: u.username, password: u.password, area: u.area, rol: u.rol, email: u.email || "", status: u.status });
    setCreateModalOpen(true);
  };

  const openCreate = () => {
    setEditUser(null);
    setForm({ nombre: "", username: "", password: "Humax2024*", area: "", rol: "solicitante", email: "", status: "activo" });
    setCreateModalOpen(true);
  };

  const handleTestEmail = async (user: User) => {
    const toastId = toast.loading(`Enviando correo de prueba a ${user.email}...`);
    try {
      await api.testUserEmail(user.id);
      toast.success(`Correo de prueba enviado a ${user.email}`, { id: toastId });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo enviar el correo de prueba", { id: toastId });
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Gestión de Usuarios</h1>
          <p className="text-sm text-slate-500 mt-0.5">{users.length} usuarios registrados</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-800">
          <UserPlus size={16} /> Nuevo Usuario
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setTab("users")}
          className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${tab === "users" ? "border-blue-700 text-blue-700" : "border-transparent text-slate-500 hover:text-slate-700"}`}
        >
          Usuarios ({users.length})
        </button>
        <button
          onClick={() => setTab("requests")}
          className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${tab === "requests" ? "border-blue-700 text-blue-700" : "border-transparent text-slate-500 hover:text-slate-700"}`}
        >
          Solicitudes de Acceso
          {pendingSolicitudes.length > 0 && (
            <span className="bg-amber-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
              {pendingSolicitudes.length}
            </span>
          )}
        </button>
      </div>

      {tab === "users" && (
        <>
          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-48">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar usuario, nombre, correo..."
                className="pl-8 pr-4 py-2 text-sm border border-slate-300 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <select value={rolFilter} onChange={(e) => setRolFilter(e.target.value as Role | "")} className="px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Todos los roles</option>
              {Object.entries(ROLE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as UserStatus | "")} className="px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Todos los estados</option>
              <option value="activo">Activo</option>
              <option value="inactivo">Inactivo</option>
              <option value="pendiente">Pendiente</option>
            </select>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            {filtered.length === 0 ? (
              <EmptyState icon={<Users size={48} />} title="No se encontraron usuarios" />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Usuario</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Área</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Rol</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Estado</th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filtered.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold shrink-0">
                              {(u.nombre || 'U').charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium text-slate-800">{u.nombre || 'Sin nombre'}</p>
                              <p className="text-xs text-slate-500">{u.username}{u.email ? ` · ${u.email}` : ""}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-600">{u.area}</td>
                        <td className="px-4 py-3">
                          <Badge label={ROLE_LABELS[u.rol]} variant="info" />
                        </td>
                        <td className="px-4 py-3">
                          <Badge label={STATUS_BADGE[u.status].label} variant={STATUS_BADGE[u.status].variant} />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1 justify-end">
                            {u.status === "activo" && u.email && (
                              <button onClick={() => handleTestEmail(u)}
                                className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors" title={`Enviar correo de prueba a ${u.email}`}>
                                <Mail size={15} />
                              </button>
                            )}
                            <button onClick={() => { updateUser(u.id, { status: u.status === "activo" ? "inactivo" : "activo" }); toast.success(`Usuario ${u.status === "activo" ? "desactivado" : "activado"}`); }}
                              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors" title={u.status === "activo" ? "Desactivar" : "Activar"}>
                              {u.status === "activo" ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                            </button>
                            <button onClick={() => { updateUser(u.id, { password: "Reset2024*" }); toast.success("Contraseña restablecida: Reset2024*"); }}
                              className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded transition-colors" title="Restablecer contraseña">
                              <Key size={15} />
                            </button>
                            <button onClick={() => openEdit(u)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors" title="Editar">
                              <Edit2 size={15} />
                            </button>
                            <button onClick={() => setDeleteConfirm(u.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors" title="Eliminar">
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {tab === "requests" && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          {solicitudes.length === 0 ? (
            <EmptyState icon={<Users size={48} />} title="No hay solicitudes" description="Las solicitudes de registro aparecerán aquí" />
          ) : (
            <div className="divide-y divide-slate-100">
              {solicitudes.map((s) => (
                <div key={s.id} className="flex items-center gap-4 px-5 py-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800">{s.nombre}</p>
                    <p className="text-xs text-slate-500">{s.username} · {s.area} · {ROLE_LABELS[s.rolSolicitado]}</p>
                    {s.email && <p className="text-xs text-slate-400">{s.email}</p>}
                    <p className="text-xs text-slate-400 mt-0.5">{new Date(s.createdAt).toLocaleDateString("es-CO")}</p>
                  </div>
                  <Badge
                    label={s.status === "pendiente" ? "Pendiente" : s.status === "aprobado" ? "Aprobado" : "Rechazado"}
                    variant={s.status === "pendiente" ? "warning" : s.status === "aprobado" ? "success" : "error"}
                  />
                  {s.status === "pendiente" && (
                    <div className="flex gap-2 shrink-0">
                      <button onClick={() => { rejectSolicitud(s.id); toast.success("Solicitud rechazada"); }} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50">
                        <XCircle size={13} /> Rechazar
                      </button>
                      <button onClick={() => { approveSolicitud(s.id); toast.success("Usuario aprobado. Contraseña: Humax2024*"); }} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-green-600 text-white rounded-lg hover:bg-green-700">
                        <CheckCircle size={13} /> Aprobar
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Create/Edit modal */}
      <Modal
        open={createModalOpen}
        onClose={() => { setCreateModalOpen(false); setEditUser(null); }}
        title={editUser ? "Editar Usuario" : "Crear Usuario"}
        size="md"
        footer={
          <>
            <button onClick={() => { setCreateModalOpen(false); setEditUser(null); }} className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900 font-medium rounded-lg hover:bg-slate-100">Cancelar</button>
            <button onClick={handleSaveUser} className="px-5 py-2 text-sm font-semibold bg-blue-700 text-white rounded-lg hover:bg-blue-800">{editUser ? "Guardar cambios" : "Crear usuario"}</button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nombre completo *</label>
              <input value={form.nombre} onChange={(e) => setForm((p) => ({ ...p, nombre: e.target.value }))} className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Usuario *</label>
              <input value={form.username} onChange={(e) => setForm((p) => ({ ...p, username: e.target.value }))} disabled={!!editUser} className="w-full px-3 py-2 text-sm border border-blue-200 rounded-lg bg-blue-50 text-blue-800 font-medium cursor-not-allowed pointer-events-none focus:outline-none" />
            </div>
            {!editUser && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Contraseña inicial</label>
                <input value={form.password} onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))} className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Área *</label>
              <select value={form.area} onChange={(e) => setForm((p) => ({ ...p, area: e.target.value }))} className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Seleccionar</option>
                {AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Rol *</label>
              <select value={form.rol} onChange={(e) => setForm((p) => ({ ...p, rol: e.target.value as Role }))} className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                {Object.entries(ROLE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Estado *</label>
              <select value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value as UserStatus }))} className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="activo">Activo</option>
                <option value="inactivo">Inactivo</option>
              </select>
            </div>
            {form.rol !== "solicitante" && (
              <div className="col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Correo corporativo *</label>
                <input value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} type="email" placeholder="usuario@humax.com.co"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            )}
          </div>
        </div>
      </Modal>

      <ConfirmModal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)}
        onConfirm={() => deleteConfirm && handleDelete(deleteConfirm)}
        title="Eliminar usuario" message="¿Está seguro de que desea eliminar este usuario? Esta acción es irreversible."
        confirmLabel="Eliminar" danger />
    </div>
  );
}
