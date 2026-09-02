# Como se hizo este proyecto (guia completa)

## 1) Resumen general
Este proyecto es una aplicacion web de gestion de Actas de Destruccion (ADD) para Humax Pharmaceutical.

Objetivo principal:
- Crear, revisar, aprobar, rechazar o devolver actas segun rol.
- Mantener trazabilidad del flujo completo de aprobacion.
- Simular un entorno productivo usando almacenamiento local (localStorage).

Tecnologias base:
- React 19 + TypeScript
- Vite 8
- Tailwind CSS v4
- React Router v8
- Framer Motion
- React Hook Form + Zod
- Sonner (notificaciones toast)
- Recharts (graficos)
- date-fns (fechas)

---

## 2) Arquitectura de alto nivel
La app esta organizada por capas funcionales:

1. Entrada y montaje
- src/main.tsx monta App en #root.

2. Capa de proveedores globales
- src/App.tsx envuelve toda la app con AuthProvider y AppProvider.

3. Capa de rutas
- src/routes.tsx define rutas publicas (login, registro) y privadas (dashboard, actas, maestros, etc).

4. Capa de layout
- src/components/layout/AppLayout.tsx renderiza Sidebar + Header + contenido.

5. Capa de paginas
- src/pages/* contiene vistas por modulo (auth, actas, dashboard, usuarios, reportes, etc).

6. Capa de estado y negocio
- src/context/AuthContext.tsx: autenticacion y sesion.
- src/context/AppContext.tsx: datos de negocio, reglas y acciones.

7. Capa de datos y constantes
- src/data/*: mocks iniciales (usuarios, actas, invima, etc).
- src/constants/index.ts: labels, colores de estado, catalogos.

---

## 3) Flujo de arranque (boot)
1. Se carga src/main.tsx.
2. Se renderiza src/App.tsx.
3. En App:
- Se aplica tema claro/oscuro segun localStorage o preferencia del sistema.
- Se monta RouterProvider con las rutas.
- Se muestra un splash de inicio animado por unos segundos.

Resultado:
- El usuario entra con una experiencia de carga visual antes de ver el contenido principal.

---

## 4) Ruteo y proteccion de acceso
Archivo clave: src/routes.tsx

Estrategia:
- RouteTransitionShell se usa como contenedor raiz para transiciones de ruta.
- Rutas publicas:
  - /login
  - /registro
- Rutas privadas bajo AppLayout:
  - /dashboard
  - /actas
  - /actas/nueva
  - /actas/:id
  - /aprobaciones
  - /usuarios
  - /maestros/cecos
  - /maestros/invima
  - /reportes
  - /busqueda
  - /notificaciones

Proteccion real:
- AppLayout verifica isAuthenticated (AuthContext).
- Si no hay sesion, redirecciona a /login.

---

## 5) Estado global y persistencia

### 5.1 AuthContext (autenticacion)
Archivo: src/context/AuthContext.tsx

Responsabilidades:
- Guardar usuario en sesion.
- Login por username/password.
- Validar estado del usuario (activo, pendiente, rechazado, inactivo).
- Logout.

Persistencia usada:
- add_current_user
- add_users

### 5.2 AppContext (negocio)
Archivo: src/context/AppContext.tsx

Estado principal:
- users
- actas
- notifications
- solicitudes
- invimaProducts

Acciones principales:
- Usuarios: crear, actualizar, eliminar, aprobar/rechazar solicitudes.
- Actas: crear, actualizar, eliminar, enviar, aprobar, rechazar, devolver.
- Notificaciones: crear y marcar leidas.
- INVIMA: CRUD de productos.

Persistencia usada:
- add_users
- add_actas
- add_notifications
- add_solicitudes
- add_invima

Patron de guardado:
- Inicializa con load(key, fallback).
- Cada actualizacion hace setState + save(key, data).

---

## 6) Modelo de datos
Archivo: src/types/index.ts

Tipos clave:
- User, Role, UserStatus
- Acta, ActaStatus
- ActaAprobacion, ActaHistorial, AjusteField
- Notification
- RegistroSolicitud
- InvimaProduct
- Ceco

Idea central:
- Cada acta tiene:
  - estado actual
  - historial de eventos
  - pasos de aprobacion (area, costos, hse)
  - bandera requiereCostos

---

## 7) Reglas de negocio importantes

### 7.1 Regla requiereCostos
Implementada en AppContext con requiresCostos(acta).

Activa revision de costos cuando:
- clasificacion producto_terminado y faltan menos de 12 meses para vencimiento
- clasificacion materia_prima y faltan menos de 6 meses
- clasificacion material_empaque
- causal dano_operativo o producto_no_conforme

### 7.2 Flujo de aprobacion
Secuencia base:
1. Solicitante crea y envia acta.
2. Aprobador de area revisa.
3. Si requiere costos -> va a costos.
4. Luego va a HSE.
5. HSE aprueba final y la acta queda aprobada.

Eventos alternos:
- Rechazo: cierra flujo en rechazada.
- Devolucion para ajustes: vuelve al solicitante con lista de ajustes.

### 7.3 Notificaciones por rol
El contexto genera notificaciones automaticas al siguiente responsable del flujo.

---

## 8) Paginas principales

### Login
Archivo: src/pages/auth/LoginPage.tsx
- Formulario con react-hook-form + zod.
- Muestra mensajes de error segun validacion y respuesta de login.
- Incluye usuarios de prueba visibles.

### Registro
Archivo: src/pages/auth/RegisterPage.tsx
- Formulario para solicitud de acceso.
- Si rol solicitado no es solicitante, exige correo corporativo.
- Guarda solicitud pendiente para aprobacion administrativa.

### Crear acta (wizard)
Archivo: src/pages/actas/ActaCreatePage.tsx
- Flujo en 6 pasos:
  1) Informacion general
  2) Material
  3) Economica
  4) Causal
  5) Observaciones/adjuntos
  6) Resumen y acciones
- Barra de progreso + Stepper.
- Puede guardar borrador o enviar a aprobacion.

### Detalle de acta
Archivo: src/pages/actas/ActaDetailPage.tsx
- Vista completa de datos.
- Timeline de aprobaciones.
- Modales para aprobar, rechazar o devolver con ajustes.

### Dashboard
Archivo: src/pages/dashboard/DashboardPage.tsx
- Cambia segun rol del usuario.
- Usa graficos con Recharts para resumenes.

---

## 9) Sistema de animaciones (detalle completo)

Se usan 3 niveles de animacion:
1. Animacion de entrada global de app.
2. Animacion corta en cambios de ruta.
3. Animaciones de interfaz en login/registro y microinteracciones.

### 9.1 Splash global de inicio
Archivo: src/App.tsx
Libreria: Framer Motion (motion + AnimatePresence)

Comportamiento:
- showSplash inicia en true.
- useEffect lo apaga con setTimeout (3000 ms).
- Overlay full screen con salida por fade.

Variantes:
- En /login: version mas cinematica (logo + texto + barra de carga + firma inferior).
- En otras rutas: version corta con logo y barra.

Tecnicas usadas:
- arrays en animate para secuencias (scale, y, opacity, rotate)
- control de ritmo con transition.times
- easeInOut para suavidad
- capa de shine bar que cruza la pantalla
- blobs con animate-pulse de Tailwind para profundidad

Resultado:
- Sensacion de marca y arranque premium antes de entrar a la app.

### 9.2 Splash de transicion entre rutas
Archivo: src/components/layout/RouteTransitionShell.tsx
Libreria: Framer Motion

Comportamiento:
- Detecta cambios de location.pathname y location.search.
- Ignora el primer render.
- Muestra overlay durante ~900 ms en cada navegacion interna.

Animaciones:
- Fondo semitransparente con blur.
- Logo con mini-secuencia de escala/traslacion.
- Barra de progreso corta.
- Fade-out rapido al salir.

Resultado:
- Cambios de pantalla mas fluidos y menos abruptos.

### 9.3 Escena animada del login
Archivo: src/pages/auth/LoginPage.tsx

Elementos animados:
- 3 blobs de color en background (Framer Motion, loops largos).
- Particulas flotantes (18 elementos con delays escalonados).
- Logo central con movimiento flotante y rotacion suave.
- Spinner en boton cuando isSubmitting = true.

Adicional:
- Se combina animacion JS (Framer Motion) con keyframes CSS (floating).

### 9.4 Registro con logo animado
Archivo: src/pages/auth/RegisterPage.tsx

Elementos:
- Reutiliza animacion flotante del logo.
- Fondo en gradiente oscuro para continuidad visual con login.

### 9.5 Microinteracciones de UI
Ejemplos:
- Sidebar expand/collapse: transition de ancho.
- Switch de tema: transicion de color y desplazamiento del thumb.
- Buttons, cards, filas de tabla: hover y transition-colors.
- Stepper/progress: transiciones en estados completado/actual.

Archivos donde se ve esto:
- src/components/layout/Sidebar.tsx
- src/components/ui/Button.tsx
- src/components/ui/StatCard.tsx
- src/components/ui/Stepper.tsx
- varias paginas en src/pages/*

### 9.6 Animaciones CSS globales
Archivo: src/index.css

Keyframes definidos:
- introLogo
- shine
- floating

Nota:
- El keyframe floating si se usa en login/registro.
- introLogo y shine quedan listos para usos futuros o variantes.

---

## 10) Estilo visual y tema oscuro
Archivo principal: src/index.css

Estrategia:
- Tailwind v4 + tokens de color en :root.
- Modo oscuro basado en html.dark.
- Sidebar controla tema y guarda preferencia en localStorage (add-theme).

Tambien se aplican overrides globales para clases frecuentes:
- bg-white, bg-slate-50, border-slate-200, text-slate-700, etc.

Objetivo:
- Hacer dark mode sin reescribir cada pagina completa.

---

## 11) Formularios y validaciones

Stack:
- react-hook-form para estado y manejo de inputs
- zod para reglas declarativas
- @hookform/resolvers para integrar ambos

Patron aplicado:
1. Definir schema con z.object.
2. Conectar con useForm({ resolver: zodResolver(schema) }).
3. Mostrar errores por campo en UI.
4. Si aplica, usar refinamientos personalizados (refine).

Se ve claramente en:
- src/pages/auth/LoginPage.tsx
- src/pages/auth/RegisterPage.tsx
- src/pages/actas/ActaCreatePage.tsx

---

## 12) Componentes reutilizables
Carpeta: src/components/ui

Piezas clave:
- Badge (estado de acta)
- Button
- EmptyState
- Modal / ConfirmModal
- StatCard
- Stepper / ProgressBar
- Timeline de aprobaciones

Beneficio:
- Uniformidad visual y menos duplicacion de codigo.

---

## 13) Datos de prueba y simulacion

Archivos:
- src/data/mockData.ts
- src/data/cecos.ts

Rol de estos datos:
- Poblar app con usuarios, actas y productos iniciales.
- Permitir demostracion funcional sin backend real.

Limitacion esperada:
- No hay API ni base de datos externa; todo es localStorage.

---

## 14) Como correr y mantener el proyecto

Comandos (package.json):
- pnpm dev
- pnpm build
- pnpm preview
- pnpm format

Notas:
- Vite ofrece recarga en caliente.
- Tailwind v4 esta conectado por @tailwindcss/vite.

---

## 15) Decisiones de diseno tecnico
1. Sin backend para acelerar prototipo funcional.
2. Context API en lugar de Redux por simplicidad y alcance.
3. Framer Motion para animaciones complejas y secuenciadas.
4. Tailwind para velocidad de UI y consistencia visual.
5. React Hook Form + Zod para formularios robustos.

---

## 16) Mejoras recomendadas (siguiente fase)
1. Migrar persistencia a API real (Node/Java/.NET + DB).
2. Implementar JWT, refresh token y permisos por endpoint.
3. Reemplazar passwords en claro por flujo seguro.
4. Agregar pruebas unitarias e integracion (Vitest + RTL).
5. Medir rendimiento de animaciones en equipos bajos.
6. Internacionalizacion y accesibilidad avanzada.

---

## 17) Mapa rapido de archivos importantes
- src/main.tsx: punto de entrada
- src/App.tsx: providers + splash global + router
- src/routes.tsx: definicion de rutas
- src/components/layout/RouteTransitionShell.tsx: splash entre rutas
- src/components/layout/AppLayout.tsx: layout autenticado
- src/components/layout/Sidebar.tsx: navegacion + tema + colapsado
- src/context/AuthContext.tsx: login/logout/sesion
- src/context/AppContext.tsx: logica principal del negocio
- src/pages/auth/LoginPage.tsx: acceso con animaciones
- src/pages/auth/RegisterPage.tsx: solicitud de registro
- src/pages/actas/ActaCreatePage.tsx: wizard de creacion
- src/pages/actas/ActaDetailPage.tsx: detalle + aprobaciones
- src/index.css: estilos globales, dark mode y keyframes

---

## 18) Conclusiones
El proyecto fue construido como una plataforma funcional de flujo documental con:
- Arquitectura clara por capas.
- Estado global centralizado con reglas de negocio reales.
- Persistencia local para prototipo completo.
- Experiencia visual cuidada mediante animaciones en momentos clave (inicio, navegacion y autenticacion).

Esto permite demostrar proceso, usabilidad y trazabilidad de punta a punta, y deja una base lista para evolucionar a una version productiva con backend real.
