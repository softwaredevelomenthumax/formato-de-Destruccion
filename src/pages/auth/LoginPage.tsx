import { useEffect, useRef, useState } from "react";
import { useNavigate, Link } from "react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Shield, AlertCircle, ChevronDown, UserRound, Moon, Sun } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { toast } from "sonner";
import { motion } from "framer-motion";
import logo from "../../public/logi.png";
import logoa from "../../public/logoa.png";


const schema = z.object({
  username: z.string().min(1, "El usuario es obligatorio"),
  password: z.string().min(1, "La contraseña es obligatoria"),
});
type FormData = z.infer<typeof schema>;

const TEST_USERS = [
  { username: "admin", password: "admin123", role: "Administrador" },
  { username: "jperez", password: "pass123", role: "Solicitante" },
  { username: "hgarces", password: "pass123", role: "HSE" },
  { username: "mgomez", password: "pass123", role: "Aprobador de área" },
  { username: "mrevelo", password: "pass123", role: "Costos" },
  { username: "agutierrez", password: "pass123", role: "Planeación" },
];

const THEME_KEY = "add-theme";

export default function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showTestUsers, setShowTestUsers] = useState(false);
  const [authError, setAuthError] = useState("");
  const testUsersRef = useRef<HTMLDivElement>(null);
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    try {
      const stored = localStorage.getItem(THEME_KEY);
      if (stored === "light" || stored === "dark") return stored;
    } catch {
      // Use the system preference when storage is unavailable.
    }
    return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      // Keep the selected theme for the current session.
    }
  }, [theme]);

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (testUsersRef.current && !testUsersRef.current.contains(event.target as Node)) {
        setShowTestUsers(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const { register, setValue, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const selectTestUser = (username: string, password: string) => {
    setValue("username", username, { shouldDirty: true, shouldValidate: true });
    setValue("password", password, { shouldDirty: true, shouldValidate: true });
    setAuthError("");
    setShowTestUsers(false);
  };

  const onSubmit = async (data: FormData) => {
    setAuthError("");
    await new Promise((r) => setTimeout(r, 300));

    try {
      const result = await login(data.username, data.password);
      if (result.success) {
        toast.success("Bienvenido al sistema ADD");
        navigate("/dashboard", { replace: true });
      } else {
        setAuthError(result.message);
      }
    } catch {
      setAuthError("Error conectando al servidor");
    }
  };

  const particles = Array.from({ length: 18 }, (_, i) => i);

  return (
    <div className={`relative flex min-h-screen flex-col overflow-hidden p-4 transition-colors duration-300 ${theme === "dark" ? "bg-[radial-gradient(circle_at_10%_20%,#1e3a8a_0%,#0f172a_40%,#020617_100%)]" : "bg-[radial-gradient(circle_at_10%_20%,#dbeafe_0%,#eff6ff_42%,#f8fafc_100%)]"}`}>
      <div className="pointer-events-none absolute inset-0">
        <motion.div
          className={`absolute -left-20 -top-20 h-80 w-80 rounded-full blur-3xl ${theme === "dark" ? "bg-cyan-400/20" : "bg-cyan-500/45"}`}
          animate={{ x: [0, 28, -10, 0], y: [0, 20, -16, 0], scale: [1, 1.15, 1.05, 1] }}
          transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className={`absolute right-[-7rem] top-[12%] h-96 w-96 rounded-full blur-3xl ${theme === "dark" ? "bg-blue-500/20" : "bg-blue-500/35"}`}
          animate={{ x: [0, -36, 10, 0], y: [0, 24, -18, 0], scale: [1.08, 1, 1.12, 1.08] }}
          transition={{ duration: 13, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className={`absolute bottom-[-8rem] left-[30%] h-80 w-80 rounded-full blur-3xl ${theme === "dark" ? "bg-indigo-400/20" : "bg-indigo-500/35"}`}
          animate={{ x: [0, 16, -22, 0], y: [0, -24, 8, 0], scale: [1, 1.1, 0.96, 1] }}
          transition={{ duration: 10.5, repeat: Infinity, ease: "easeInOut" }}
        />

        <div className={`absolute inset-0 opacity-70 ${theme === "dark" ? "bg-[linear-gradient(110deg,rgba(255,255,255,0.08)_0%,rgba(255,255,255,0)_45%,rgba(255,255,255,0.08)_100%)]" : "bg-[linear-gradient(110deg,rgba(37,99,235,0.12)_0%,rgba(255,255,255,0)_45%,rgba(14,165,233,0.14)_100%)]"}`} />

        {particles.map((p) => (
          <motion.span
            key={p}
            className={`absolute block rounded-full ${theme === "dark" ? "bg-white/35" : "bg-blue-700/30"}`}
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

      <div ref={testUsersRef} className="absolute right-4 top-4 z-30 flex items-start gap-2">
        <button
          type="button"
          onClick={() => setTheme((current) => current === "dark" ? "light" : "dark")}
          className={`flex h-9 w-9 items-center justify-center rounded-full border shadow-sm backdrop-blur-sm transition-colors ${theme === "dark" ? "border-slate-500 bg-slate-950/90 text-amber-300 hover:border-slate-400 hover:bg-slate-800" : "border-blue-700/30 bg-blue-900/20 text-blue-950 hover:bg-blue-900/30"}`}
          title={theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
          aria-label={theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
        >
          {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
        </button>
        <button
          type="button"
          onClick={() => setShowTestUsers((visible) => !visible)}
          className={`flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold shadow-sm backdrop-blur-sm transition-colors ${theme === "dark" ? "border-slate-500 bg-slate-950/90 text-slate-100 hover:border-slate-400 hover:bg-slate-800" : "border-blue-700/30 bg-blue-900/20 text-blue-950 hover:bg-blue-900/30"}`}
          aria-expanded={showTestUsers}
        >
          <UserRound size={14} />
          Usuarios de prueba
          <ChevronDown size={14} className={`transition-transform ${showTestUsers ? "rotate-180" : ""}`} />
        </button>

        {showTestUsers && (
          <div className="absolute right-0 mt-3 grid w-72 max-w-[calc(100vw-2rem)] gap-2 rounded-xl border border-slate-600/70 bg-slate-950/95 p-3 shadow-xl backdrop-blur-sm">
            {TEST_USERS.map((testUser) => (
              <button
                key={testUser.username}
                type="button"
                onClick={() => selectTestUser(testUser.username, testUser.password)}
                className="flex items-center justify-between rounded-lg px-3 py-2 text-left text-xs text-blue-100 transition-colors hover:bg-white/10"
              >
                <span>
                  <span className="block font-semibold">{testUser.username}</span>
                  <span className="text-blue-200/70">{testUser.role}</span>
                </span>
                <span className="font-mono text-blue-200/80">{testUser.password}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="relative flex w-full flex-1 items-center justify-center py-8">
      <div className="w-full max-w-md">

        {/* Logo flotante */}
        <div className="flex justify-center relative z-20 -mb-12">
          <div
            className="flex h-28 w-28 items-center justify-center rounded-full !bg-white shadow-2xl"
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
<div className="!overflow-hidden rounded-2xl border border-white/40 !bg-white shadow-2xl backdrop-blur-sm">

  {/* Header */}
  <div className="bg-blue-700 px-8 pb-6 pt-14 text-center text-white">
    <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-white/20">
      <img
        src={logo}
        alt="Logo Humax"
        className="w-10 h-10 object-contain"
      />
    </div>

    <h1 className="text-xl font-bold">
      Humax Pharmaceutical
    </h1>

    <p className="mt-1 text-sm font-medium text-blue-200">
      Sistema de Gestión de Actas de Destrucción
    </p>

    <p className="mt-1 text-xs text-blue-200">
      FORMHUM000192 — Plataforma Digital
    </p>
  </div>

  {/* Formulario */}
  <form
    onSubmit={handleSubmit(onSubmit)}
    autoComplete="off"
    className="space-y-5 !bg-white px-8 py-7 !text-slate-900"
  >
    {authError && (
      <div className="flex items-start gap-2 rounded-lg border !border-red-200 !bg-red-50 px-4 py-3 text-sm !text-red-700">
        <AlertCircle size={16} className="shrink-0 mt-0.5" />
        <span>{authError}</span>
      </div>
    )}

    <div>
      <label className="mb-1.5 block text-sm font-medium !text-slate-700">
        Usuario
      </label>

      <input
        {...register("username")}
        type="text"
        autoComplete="off"
        placeholder="Ingrese su usuario"
        className={`w-full px-3.5 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
          errors.username
            ? "border-red-400 !bg-red-50"
            : "border-slate-300 !bg-white !text-slate-900 placeholder:text-slate-400"
        }`}
      />

      {errors.username && (
        <p className="text-red-500 text-xs mt-1">
          {errors.username.message}
        </p>
      )}
    </div>

    <div>
      <label className="mb-1.5 block text-sm font-medium !text-slate-700">
        Contraseña
      </label>

      <div className="relative">
        <input
          {...register("password")}
          type={showPassword ? "text" : "password"}
          autoComplete="new-password"
          placeholder="Ingrese su contraseña"
          className={`w-full px-3.5 py-2.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all pr-10 ${
            errors.password
              ? "border-red-400 !bg-red-50"
              : "border-slate-300 !bg-white !text-slate-900 placeholder:text-slate-400"
          }`}
        />

        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
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

    <p className="text-center text-sm !text-slate-500">
      ¿No tiene acceso?{" "}
      <Link
        to="/registro"
        className="font-medium !text-blue-700 hover:text-blue-900"
      >
        Solicitar registro
      </Link>
    </p>
  </form>

</div>

      </div>

      </div>

    </div>
  );
}
