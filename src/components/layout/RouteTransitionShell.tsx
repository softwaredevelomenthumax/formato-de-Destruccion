import { useEffect, useRef, useState } from "react";
import { Outlet, useLocation } from "react-router";
import { AnimatePresence, motion } from "framer-motion";
import logoa from "../../assets/logoa.png";

export function RouteTransitionShell() {
  const location = useLocation();
  const [showRouteSplash, setShowRouteSplash] = useState(false);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    setShowRouteSplash(true);
    const timer = window.setTimeout(() => setShowRouteSplash(false), 900);
    return () => window.clearTimeout(timer);
  }, [location.pathname, location.search]);

  return (
    <>
      <Outlet />

      <AnimatePresence>
        {showRouteSplash && (
          <motion.div
            key={`${location.pathname}${location.search}`}
            className="pointer-events-none fixed inset-0 z-[9000] flex items-center justify-center bg-white/88 backdrop-blur-[2px] dark:bg-slate-950/84"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.22, ease: "easeOut" } }}
          >
            <motion.div
              className="flex flex-col items-center"
              initial={{ scale: 0.72, opacity: 0.1, y: 16 }}
              animate={{ scale: [0.72, 1.05, 0.46], opacity: [0.1, 1, 1], y: [16, 0, -88] }}
              transition={{ duration: 0.82, times: [0, 0.5, 1], ease: "easeInOut" }}
            >
              <motion.img
                src={logoa}
                alt="Humax"
                className="h-28 w-28 object-contain drop-shadow-[0_10px_22px_rgba(37,99,235,0.2)]"
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 0.9, repeat: Infinity, ease: "easeInOut" }}
              />
              <div className="mt-2 h-1.5 w-40 overflow-hidden rounded-full bg-slate-200 shadow-inner dark:bg-slate-700">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 via-cyan-400 to-blue-600"
                  initial={{ width: "0%" }}
                  animate={{ width: ["0%", "38%", "72%", "100%"] }}
                  transition={{ duration: 0.8, times: [0, 0.3, 0.7, 1], ease: "easeInOut" }}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
