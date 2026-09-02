# Documentación del proyecto — Sistema ADD

## 1. Descripción general

El proyecto es una aplicación web para la gestión de actas de destrucción, diseñada para apoyar procesos operativos, administrativos y de aprobación dentro de una organización. La plataforma permite:

- Registrar actas de destrucción
- Revisar y aprobar solicitudes por roles definidos
- Consultar maestros como CECOs e INVIMA
- Gestionar usuarios y permisos
- Visualizar reportes y estadísticas
- Mantener seguimiento de notificaciones y actividades

La interfaz está desarrollada con React + Vite y la capa visual utiliza Tailwind CSS. La aplicación se conecta a un backend Node.js con SQL Server para persistencia y autenticación.

---

## 2. Stack tecnológico

### Frontend
- React 19
- React Router
- TypeScript
- Vite
- Tailwind CSS v4
- Framer Motion
- Recharts
- Sonner
- Lucide React

### Backend
- Node.js
- Express
- SQL Server
- JWT para autenticación

---

## 3. Estructura del proyecto

```text
src/
  App.tsx
  routes.tsx
  index.css
  main.tsx
  assets/
  components/
    layout/
      AppLayout.tsx
      Header.tsx
      Sidebar.tsx
      RouteTransitionShell.tsx
    ui/
  context/
    AppContext.tsx
    AuthContext.tsx
  data/
  pages/
    actas/
    auth/
    dashboard/
    maestros/
    notifications/
    profile/
    reports/
    search/
    users/
  services/
  types/
backend/
  src/
    controllers/
    database/
    middleware/
    routes/
```

### Puntos clave
- [src/App.tsx](../src/App.tsx): maneja la carga inicial, tema y splash screen.
- [src/routes.tsx](../src/routes.tsx): definición de rutas principales.
- [src/components/layout/AppLayout.tsx](../src/components/layout/AppLayout.tsx): layout autenticado con sidebar y header.
- [src/components/layout/Sidebar.tsx](../src/components/layout/Sidebar.tsx): navegación por roles.
- [src/pages/dashboard/DashboardPage.tsx](../src/pages/dashboard/DashboardPage.tsx): dashboard adaptado por tipo de usuario.
- [src/context/AuthContext.tsx](../src/context/AuthContext.tsx): autenticación y sesión.
- [src/context/AppContext.tsx](../src/context/AppContext.tsx): estado global del negocio.

---

## 4. Roles y permisos

El sistema contempla varios roles con distintos accesos:

- Administrador
- Solicitante
- Aprobador de área
- Costos
- HSE
- Planeación

Cada rol tiene un conjunto diferenciado de módulos y permisos. La navegación se filtra dinámicamente según el rol del usuario autenticado en [src/components/layout/Sidebar.tsx](../src/components/layout/Sidebar.tsx).

---

## 5. Flujo principal de negocio

### 5.1 Inicio de sesión
El usuario inicia sesión con credenciales o con usuarios de prueba desde la pantalla de login. Al autenticarse, la sesión se mantiene con el contexto de autenticación y se redirige al dashboard.

### 5.2 Gestión de actas
Un solicitante puede crear y consultar actas. Las actas pueden pasar por distintos estados, por ejemplo:

- borrador
- enviada
- pendiente_aprobacion_area
- pendiente_costos
- pendiente_hse
- aprobada
- rechazada
- devuelta_ajustes

### 5.3 Aprobaciones
Los aprobadores revisan las actas según su rol. El proceso puede requerir validación por áreas y costos antes de aprobarse totalmente.

### 5.4 Reportes
La aplicación cuenta con visualizaciones de indicadores y métricas para soporte administrativo y seguimiento de desempeño.

---

## 6. Modo oscuro y experiencia visual

La aplicación incluye:

- cambio de tema claro/oscuro
- splash screen al iniciar la aplicación
- transiciones suaves al navegar entre rutas
- visualización responsiva para paneles y formularios

La configuración del tema se guarda en localStorage y se aplica sobre el documento HTML mediante clases dark.

---

## 7. Comandos de ejecución

### Instalación
```bash
pnpm install
```

### Desarrollo
```bash
pnpm run dev
```

### Build de producción
```bash
pnpm run build
```

### Vista previa
```bash
pnpm run preview
```

### Backend
```bash
cd backend
pnpm install
pnpm run dev
```

---

## 8. Variables de entorno

La aplicación frontend usa la URL del backend mediante una variable de entorno:

```env
VITE_API_URL=http://localhost:3001/api
```

Esto permite separar la configuración y facilitar despliegues en distintos entornos.

---

## 9. Mejora aplicada

Se añadió una transición suave entre rutas para mejorar la sensación de navegación, con un efecto de entrada/salida al cambiar de página. La lógica vive en:

- [src/components/layout/RouteTransitionShell.tsx](../src/components/layout/RouteTransitionShell.tsx)

Esto mejora la fluidez general sin introducir complejidad adicional.

---

## 10. Recomendaciones futuras

Estas son mejoras que pueden añadirse en una siguiente iteración:

1. Mejorar la gestión de errores globales con mensajes más claros y reutilizables.
2. Añadir filtros avanzados por fechas, estado y empresa en la vista de actas.
3. Crear paginación o carga progresiva para listas grandes.
4. Agregar exportación a Excel/PDF para reportes y actas.
5. Añadir una vista de actividad reciente más detallada con historial por acta.
6. Mejorar la validación de formularios con mensajes contextualizados por campo.
7. Añadir pruebas automatizadas para componentes y flujos críticos.

---

## 11. Observaciones finales

La app ya presenta una base sólida, con una estructura bien organizada y una experiencia visual cuidada. La mejora principal que aporta valor inmediato es la continuidad visual y la consistencia de navegación. El proyecto está listo para seguir creciendo y adaptándose a reglas de negocio más complejas.
