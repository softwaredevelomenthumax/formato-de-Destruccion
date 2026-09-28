import { RouterProvider } from "react-router";
import { useEffect } from "react";
import { router } from "./routes";
import { AuthProvider } from "./context/AuthContext";
import { AppProvider } from "./context/AppContext";

const THEME_KEY = "add-theme";

export default function App() {
  useEffect(() => {
    try {
      const stored = localStorage.getItem(THEME_KEY);
      const theme =
        stored === "light" || stored === "dark"
          ? stored
          : typeof window.matchMedia === "function" && window.matchMedia("(prefers-color-scheme: dark)").matches
            ? "dark"
            : "light";

      document.documentElement.classList.toggle("dark", theme === "dark");
    } catch {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  return (
    <AuthProvider>
      <AppProvider>
        <RouterProvider router={router} />
      </AppProvider>
    </AuthProvider>
  );
}
