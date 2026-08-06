import { RouterProvider } from "react-router";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { router } from "./routes";
import { AuthProvider } from "./context/AuthContext";
import { AppProvider } from "./context/AppContext";
import logoa from "./assets/logoa.png";

const THEME_KEY = "add-theme";

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const isLoginRoute = typeof window !== "undefined" && window.location.pathname === "/login";

  useEffect(() => {
    const stored = localStorage.getItem(THEME_KEY);
    const theme =
      stored === "light" || stored === "dark"
        ? stored
        : window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light";

    document.documentElement.classList.toggle("dark", theme === "dark");
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => setShowSplash(false), 3000);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <>
      <AuthProvider>
        <AppProvider>
          <RouterProvider router={router} />
        </AppProvider>
      </AuthProvider>

      <AnimatePresence>
        {showSplash && (
          <motion.div
            className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden bg-white"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.75, ease: "easeInOut" } }}
          >
            <div className="pointer-events-none absolute inset-0 opacity-70">
              <div className="absolute -left-16 top-1/4 h-64 w-64 rounded-full bg-blue-100 blur-3xl animate-pulse" />
              <div className="absolute -right-10 bottom-1/4 h-72 w-72 rounded-full bg-cyan-100 blur-3xl animate-pulse [animation-delay:250ms]" />
            </div>

            {isLoginRoute ? (
              <motion.div
                className="relative z-10 flex flex-col items-center"
                initial={{ scale: 0.35, opacity: 0, y: 24 }}
                animate={{
                  scale: [0.35, 1.12, 1, 1.03, 1, 0.46],
                  opacity: [0, 1, 1, 1, 1, 1],
                  y: [24, 0, -8, 0, -4, -350],
                }}
                transition={{ duration: 2.9, times: [0, 0.22, 0.42, 0.62, 0.82, 1], ease: "easeInOut" }}
              >
                <motion.img
                  src={logoa}
                  alt="Humax"
                  className="h-60 w-60 object-contain drop-shadow-[0_16px_38px_rgba(37,99,235,0.28)] sm:h-72 sm:w-72"
                  animate={{
                    y: [0, -10, 0, -6, 0],
                    scale: [1, 1.035, 1, 1.015, 1],
                    rotate: [0, 0.4, 0, -0.4, 0],
                  }}
                  transition={{ duration: 2.2, times: [0, 0.3, 0.58, 0.8, 1], ease: "easeInOut" }}
                />
                <motion.p
                  className="mt-6 text-sm font-semibold tracking-[0.22em] text-blue-700"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 1, 1, 0.8, 0] }}
                  transition={{ duration: 2.25, times: [0, 0.25, 0.55, 0.75, 1] }}
                >
                  HUMAX PHARMACEUTICAL
                </motion.p>

                <motion.div
                  className="mt-4 h-2 w-52 overflow-hidden rounded-full bg-slate-200/90 shadow-inner"
                  animate={{ opacity: [0.2, 1, 1, 0] }}
                  transition={{ duration: 2.25, times: [0, 0.2, 0.78, 1], ease: "easeInOut" }}
                >
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-blue-500 via-cyan-400 to-blue-600"
                    initial={{ width: "0%" }}
                    animate={{ width: ["0%", "28%", "52%", "76%", "100%"] }}
                    transition={{ duration: 2.05, times: [0, 0.2, 0.45, 0.72, 1], ease: "easeInOut" }}
                  />
                </motion.div>
                <motion.p
                  className="mt-1 text-xs font-medium tracking-wide text-slate-500"
                  animate={{ opacity: [0.35, 1, 1, 0] }}
                  transition={{ duration: 2.25, times: [0, 0.2, 0.78, 1], ease: "easeInOut" }}
                >
                  Cargando...
                </motion.p>
              </motion.div>
            ) : (
              <motion.div
                className="relative z-10 flex flex-col items-center"
                initial={{ scale: 0.5, opacity: 0.2, y: 22 }}
                animate={{
                  scale: [0.5, 1.06, 1, 0.45],
                  opacity: [0.2, 1, 1, 1],
                  y: [22, 0, -10, -120],
                }}
                transition={{ duration: 1.25, times: [0, 0.28, 0.65, 1], ease: "easeInOut" }}
              >
                <motion.img
                  src={logoa}
                  alt="Humax"
                  className="h-36 w-36 object-contain drop-shadow-[0_12px_28px_rgba(37,99,235,0.2)]"
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                />
                <div className="mt-3 h-1.5 w-44 overflow-hidden rounded-full bg-slate-200/90 shadow-inner">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-blue-500 via-cyan-400 to-blue-600"
                    initial={{ width: "0%" }}
                    animate={{ width: ["0%", "35%", "68%", "100%"] }}
                    transition={{ duration: 1.05, times: [0, 0.3, 0.7, 1], ease: "easeInOut" }}
                  />
                </div>
              </motion.div>
            )}

            <motion.div
              className="absolute inset-x-0 top-0 h-full bg-gradient-to-r from-transparent via-white/80 to-transparent"
              initial={{ x: "-120%" }}
              animate={{ x: "120%" }}
              transition={{ duration: 1.2, ease: "easeInOut", delay: 0.5 }}
            />

            {isLoginRoute && (
              <p className="absolute inset-x-0 bottom-8 z-10 mx-auto w-fit rounded-full border border-blue-200/80 bg-blue-50/85 px-4 py-1.5 text-center text-xs font-semibold text-blue-700 shadow-sm backdrop-blur-sm">
                Humax Pharmaceutical, filial de Bausch Health Companies Inc.
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
