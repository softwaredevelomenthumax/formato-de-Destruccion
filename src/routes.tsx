import { createBrowserRouter, Navigate } from "react-router";
import { AppLayout } from "./components/layout/AppLayout";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import DashboardPage from "./pages/dashboard/DashboardPage";
import ActaListPage from "./pages/actas/ActaListPage";
import ActaCreatePage from "./pages/actas/ActaCreatePage";
import ActaDetailPage from "./pages/actas/ActaDetailPage";
import AprobacionesPage from "./pages/actas/AprobacionesPage";
import UserManagementPage from "./pages/users/UserManagementPage";
import CecosPage from "./pages/maestros/CecosPage";
import InvimaPage from "./pages/maestros/InvimaPage";
import ReportsPage from "./pages/reports/ReportsPage";
import SearchPage from "./pages/search/SearchPage";
import NotificationsPage from "./pages/notifications/NotificationsPage";
import ProfilePage from "./pages/profile/ProfilePage";
import { RouteTransitionShell } from "./components/layout/RouteTransitionShell";

export const router = createBrowserRouter([
  {
    Component: RouteTransitionShell,
    children: [
      { path: "/login", Component: LoginPage },
      { path: "/registro", Component: RegisterPage },
      {
        path: "/",
        Component: AppLayout,
        children: [
          { index: true, element: <Navigate to="/dashboard" replace /> },
          { path: "dashboard", Component: DashboardPage },
          { path: "actas", Component: ActaListPage },
          { path: "actas/nueva", Component: ActaCreatePage },
          { path: "actas/:id", Component: ActaDetailPage },
          { path: "actas/:id/editar", Component: ActaCreatePage },
          { path: "aprobaciones", Component: AprobacionesPage },
          { path: "usuarios", Component: UserManagementPage },
          { path: "maestros/cecos", Component: CecosPage },
          { path: "maestros/invima", Component: InvimaPage },
          { path: "reportes", Component: ReportsPage },
          { path: "busqueda", Component: SearchPage },
          { path: "notificaciones", Component: NotificationsPage },
          { path: "perfil", Component: ProfilePage },
        ],
      },
      { path: "*", element: <Navigate to="/dashboard" replace /> },
    ],
  },
]);
