import { useState } from "react";
import { useNavigate, Link } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Shield, AlertCircle } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { toast } from "sonner";
import { motion } from "framer-motion";
import logo from "../../assets/logi.png";
import logoa from "../../assets/logoa.png";


const schema = z.object({
  username: z.string().min(1, "El usuario es obligatorio"),
  password: z.string().min(1, "La contraseña es obligatoria"),
  remember: z.boolean().optional(),
});
type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState("");

  if (isAuthenticated) {
    navigate("/dashboard", { replace: true });
    return null;
  }

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setAuthError("");
    await new Promise((r) => setTimeout(r, 300));
    const result = login(data.username, data.password);
    if (result.success) {
      toast.success("Bienvenido al sistema ADD");
      navigate("/dashboard", { replace: true });
    } else {
      setAuthError(result.message);
    }
  };

  const particles = Array.from({ length: 18 }, (_, i) => i);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_10%_20%,#1e3a8a_0%,#0f172a_40%,#020617_100%)] flex items-center justify-center p-4">
      <div className="pointer-events-none absolute inset-0">
        <motion.div
          className="absolute -left-20 -top-20 h-80 w-80 rounded-full bg-cyan-400/20 blur-3xl"
          animate={{ x: [0, 28, -10, 0], y: [0, 20, -16, 0], scale: [1, 1.15, 1.05, 1] }}
          transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute right-[-7rem] top-[12%] h-96 w-96 rounded-full bg-blue-500/20 blur-3xl"
          animate={{ x: [0, -36, 10, 0], y: [0, 24, -18, 0], scale: [1.08, 1, 1.12, 1.08] }}
          transition={{ duration: 13, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-[-8rem] left-[30%] h-80 w-80 rounded-full bg-indigo-400/20 blur-3xl"
          animate={{ x: [0, 16, -22, 0], y: [0, -24, 8, 0], scale: [1, 1.1, 0.96, 1] }}
          transition={{ duration: 10.5, repeat: Infinity, ease: "easeInOut" }}
        />

        <div className="absolute inset-0 bg-[linear-gradient(110deg,rgba(255,255,255,0.08)_0%,rgba(255,255,255,0)_45%,rgba(255,255,255,0.08)_100%)] opacity-70" />

        {particles.map((p) => (
          <motion.span
            key={p}
            className="absolute block rounded-full bg-white/20"
            style={{
              width: `${4 + (p % 4)}px`,
              height: `${4 + (p % 4)}px`,
              left: `${(p * 13) % 100}%`,
              top: `${(p * 17) % 100}%`,
            }}
            animate={{
              y: [0, -18, 0],
              opacity: [0.2, 0.65, 0.2],
            }}
            transition={{
              duration: 3 + (p % 5),
              repeat: Infinity,
              ease: "easeInOut",
              delay: p * 0.12,
            }}
          />
        ))}
      </div>

      <div className="w-full max-w-md relative">

        {/* Logo flotante */}
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

        {/* Card */}
<div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden border border-white/40">

  {/* Header */}
  <div className="bg-blue-700 pt-14 px-8 pb-6 text-white text-center">
    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mx-auto mb-3">
      <img
        src={logo}
        alt="Logo Humax"
        className="w-10 h-10 object-contain"
      />
    </div>

    <h1 className="text-xl font-bold">
      Humax Pharmaceutical
    </h1>

    <p className="text-blue-200 text-sm mt-1 font-medium">
      Sistema de Gestión de Actas de Destrucción
    </p>

    <p className="text-blue-300 text-xs mt-1">
      FORMHUM000192 — Plataforma Digital
    </p>
  </div>

  {/* Formulario */}
  <form
    onSubmit={handleSubmit(onSubmit)}
    className="px-8 py-7 space-y-5 bg-white"
  >
    {authError && (
      <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 text-sm">
        <AlertCircle size={16} className="shrink-0 mt-0.5" />
        <span>{authError}</span>
      </div>
    )}

    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1.5">
        Usuario
      </label>

      <input
        {...register("username")}
        type="text"
        autoComplete="username"
        placeholder="Ingrese su usuario"
        className={`w-full px-3.5 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
          errors.username
            ? "border-red-400 bg-red-50"
            : "border-slate-300"
        }`}
      />

      {errors.username && (
        <p className="text-red-500 text-xs mt-1">
          {errors.username.message}
        </p>
      )}
    </div>

    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1.5">
        Contraseña
      </label>

      <div className="relative">
        <input
          {...register("password")}
          type={showPassword ? "text" : "password"}
          autoComplete="current-password"
          placeholder="Ingrese su contraseña"
          className={`w-full px-3.5 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all pr-10 ${
            errors.password
              ? "border-red-400 bg-red-50"
              : "border-slate-300"
          }`}
        />

        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
        >
          {showPassword ? (
            <EyeOff size={16} />
          ) : (
            <Eye size={16} />
          )}
        </button>
      </div>

      {errors.password && (
        <p className="text-red-500 text-xs mt-1">
          {errors.password.message}
        </p>
      )}
    </div>

    <div className="flex items-center gap-2">
      <input
        {...register("remember")}
        id="remember"
        type="checkbox"
        className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
      />

      <label
        htmlFor="remember"
        className="text-sm text-slate-600 cursor-pointer"
      >
        Recordarme
      </label>
    </div>

    <button
      type="submit"
      disabled={isSubmitting}
      className="w-full bg-blue-700 text-white py-2.5 rounded-lg font-semibold text-sm hover:bg-blue-800 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
    >
      {isSubmitting ? (
        <>
          <svg
            className="animate-spin h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>

          Iniciando sesión...
        </>
      ) : (
        "Iniciar Sesión"
      )}
    </button>

    <p className="text-center text-sm text-slate-500">
      ¿No tiene acceso?{" "}
      <Link
        to="/registro"
        className="text-blue-700 hover:text-blue-900 font-medium"
      >
        Solicitar registro
      </Link>
    </p>
  </form>

</div>

      <p className="text-center text-x text-slate-500 mt-4">
        Usuarios de prueba:
        <span className="block font-mono text-slate-400">admin / admin123</span>
        <span className="block font-mono text-slate-400">jperez / SOLICITANTE / pass123</span>
        <span className="block font-mono text-slate-400">hgarces / HSE / pass123</span>
        <span className="block font-mono text-slate-400">mgomez / APROBADOR DE ÁREA / pass123</span>
        <span className="block font-mono text-slate-400">mrevelo / COSTOS / pass123</span>
        <span className="block font-mono text-slate-400">agutierrez / PLANEACIÓN / pass123</span>
      </p>
      </div>

      <p className="pointer-events-none absolute inset-x-0 bottom-5 mx-auto w-fit rounded-full border border-blue-200/30 bg-blue-500/15 px-4 py-1.5 text-center text-xs font-semibold text-blue-100 shadow-sm backdrop-blur-sm">
        Humax Pharmaceutical, filial de Bausch Health Companies Inc.
      </p>
    </div>
  );
}
