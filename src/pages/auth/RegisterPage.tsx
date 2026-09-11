import { useState } from "react";
import { useNavigate, Link } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, CheckCircle2, Shield } from "lucide-react";
import { motion } from "framer-motion";
import { useApp } from "../../context/AppContext";
import { ROLE_LABELS, AREAS } from "../../constants";
import type { Role } from "../../types";
import logoa from "../../public/logoa.png";

const schema = z.object({
  username: z.string().min(3, "Mínimo 3 caracteres").max(20, "Máximo 20 caracteres"),
  password: z.string().min(8, "Mínimo 8 caracteres"),
  confirmPassword: z.string(),
  area: z.string().min(1, "Seleccione un área"),
  rolSolicitado: z.enum(["solicitante", "aprobador_area", "costos", "hse", "planeacion"] as const),
  email: z.string().email("Correo inválido").optional().or(z.literal("")),
}).refine((d) => d.password === d.confirmPassword, {
  path: ["confirmPassword"],
  message: "Las contraseñas no coinciden",
}).refine((d) => {
  if (d.rolSolicitado !== "solicitante") return !!d.email;
  return true;
}, { path: ["email"], message: "El correo corporativo es obligatorio para este rol" });

type FormData = z.infer<typeof schema>;

const REQUESTABLE_ROLES: { value: Role; label: string }[] = [
  { value: "solicitante", label: ROLE_LABELS["solicitante"] },
  { value: "aprobador_area", label: ROLE_LABELS["aprobador_area"] },
  { value: "costos", label: ROLE_LABELS["costos"] },
  { value: "hse", label: ROLE_LABELS["hse"] },
  { value: "planeacion", label: ROLE_LABELS["planeacion"] },
];

export default function RegisterPage() {
  const { registerSolicitud, users } = useApp();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { rolSolicitado: "solicitante" },
  });

  const rolSolicitado = watch("rolSolicitado");
  const requireEmail = rolSolicitado !== "solicitante";

  const onSubmit = async (data: FormData) => {
    setSubmitError("");
    const exists = users.find((u) => u.username === data.username);
    if (exists) {
      setSubmitError("Ese usuario ya existe");
      return;
    }
    try {
      await new Promise((r) => setTimeout(r, 400));
      await registerSolicitud({
        username: data.username,
        password: data.password,
        nombre: data.username,
        area: data.area,
        rolSolicitado: data.rolSolicitado,
        email: data.email || undefined,
      });
      setSubmitted(true);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "No se pudo guardar la solicitud");
    }
  };

  if (submitted) {
    return (
      <div className="relative h-screen overflow-y-auto bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 flex items-start justify-center px-4 py-8 sm:items-center">
        <div className="bg-white rounded-2xl shadow-2xl p-10 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={32} className="text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Solicitud enviada</h2>
          <p className="text-slate-600 mt-2 text-sm">
            Su registro fue recibido correctamente. Espere la autorización de la administración del sistema para poder ingresar.
            Si registró un correo, también recibirá allí el mensaje de bienvenida.
          </p>
          <button
            onClick={() => navigate("/login")}
            className="mt-6 bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium text-sm hover:bg-blue-800 transition-colors"
          >
            Volver al inicio de sesión
          </button>
        </div>

      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md relative">
        <div className="flex justify-center relative z-20 -mb-12">
          <div
            className="w-28 h-28 rounded-full bg-white shadow-2xl flex items-center justify-center"
            style={{
              animation: "floating 3s ease-in-out infinite",
            }}
          >
            <motion.img
              src={logoa}
              alt="Logo"
              className="w-32 h-32 object-contain"
              animate={{
                y: [0, -10, -18, -12, -6, 0],
                x: [0, 2, -2, 3, -1, 0],
                rotate: [0, 1.5, -1, 1, -0.5, 0],
                scale: [1.05, 1.15, 1.18, 1.09, 1.07, 1.05],
              }}
              transition={{
                duration: 7,
                repeat: Infinity,
                repeatType: "mirror",
                ease: [0.42, 0, 0.58, 1],
              }}
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="bg-blue-700 px-8 pt-14 pb-5 text-white text-center">
            <Shield size={24} className="mx-auto mb-2 text-white" />
            <h1 className="text-lg font-bold">Solicitud de Acceso</h1>
            <p className="text-blue-200 text-xs mt-1">Sistema ADD — Humax Pharmaceutical</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} autoComplete="off" className="px-8 py-6 space-y-4">
            {submitError && <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{submitError}</p>}
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Usuario *</label>
                <input
                  {...register("username")}
                  autoComplete="off"
                  placeholder="usuario.apellido"
                  className={`w-full px-3.5 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.username ? "border-red-400" : "border-slate-300"}`}
                />
                {errors.username && <p className="text-red-500 text-xs mt-1">{errors.username.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Contraseña *</label>
                <div className="relative">
                  <input
                    {...register("password")}
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Mínimo 8 caracteres"
                    className={`w-full px-3.5 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10 ${errors.password ? "border-red-400" : "border-slate-300"}`}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Confirmar contraseña *</label>
                <div className="relative">
                  <input
                    {...register("confirmPassword")}
                    type={showConfirm ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="Repita la contraseña"
                    className={`w-full px-3.5 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10 ${errors.confirmPassword ? "border-red-400" : "border-slate-300"}`}
                  />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Área *</label>
                <select
                  {...register("area")}
                  className={`w-full px-3.5 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white ${errors.area ? "border-red-400" : "border-slate-300"}`}
                >
                  <option value="">Seleccione un área</option>
                  {AREAS.map((a) => <option key={a} value={a}>{a}</option>)}
                </select>
                {errors.area && <p className="text-red-500 text-xs mt-1">{errors.area.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Rol solicitado *</label>
                <select
                  {...register("rolSolicitado")}
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  {REQUESTABLE_ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>

              {requireEmail && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Correo corporativo *
                    <span className="text-slate-400 font-normal ml-1">(requerido para aprobadores)</span>
                  </label>
                  <input
                    {...register("email")}
                    type="email"
                    placeholder="nombre@humax.com.co"
                    className={`w-full px-3.5 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.email ? "border-red-400" : "border-slate-300"}`}
                  />
                  {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-blue-700 text-white py-2.5 rounded-lg font-semibold text-sm hover:bg-blue-800 transition-colors disabled:opacity-60"
            >
              {isSubmitting ? "Enviando solicitud..." : "Solicitar Acceso"}
            </button>

            <p className="text-center text-sm text-slate-500">
              ¿Ya tiene cuenta?{" "}
              <Link to="/login" className="text-blue-700 hover:text-blue-900 font-medium">Iniciar sesión</Link>
            </p>
          </form>
        </div>
      </div>

    </div>
  );
}
