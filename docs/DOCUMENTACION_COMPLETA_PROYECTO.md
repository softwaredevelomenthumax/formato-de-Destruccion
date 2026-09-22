# Documentación completa del proyecto — Destrucción Gestión

## 1. Introducción

Este proyecto corresponde a una aplicación web para la gestión de actas de destrucción, diseñada para apoyar procesos operativos, administrativos, de aprobación y seguimiento dentro de una organización. La solución está compuesta por un frontend en React + Vite y un backend en Node.js + Express con SQL Server como motor de persistencia.

El sistema permite:

- Registrar y consultar actas de destrucción
- Gestionar aprobaciones por rol y área funcional
- Administrar usuarios, permisos y solicitudes de acceso
- Mantener maestros como CECOs e INVIMA
- Visualizar dashboards, reportes y alertas
- Enviar notificaciones internas y correos automáticos
- Seguir la trazabilidad de cada proceso por historial y estado

El proyecto está orientado a un entorno corporativo y utiliza autenticación con JWT, control de acceso por roles y una experiencia visual moderna con Tailwind CSS.

---

## 2. Objetivo del sistema

El objetivo principal es centralizar la gestión de actas de destrucción dentro de un flujo estructurado que permita:

1. Capturar la información necesaria del proceso de destrucción.
2. Validar la solicitud conforme a reglas internas y roles definidos.
3. Seguir la aprobación por áreas como costos, HSE, planeación y administración.
4. Mantener un historial completo para auditoría y trazabilidad.
5. Acceder a métricas y reportes para seguimiento operativo y análisis.

---

## 3. Stack tecnológico

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
- Zod + React Hook Form

### Backend
- Node.js
- Express
- SQL Server
- JWT
- bcryptjs
- CORS
- Nodemailer
- XLSX
- UUID

### Herramientas de desarrollo
- pnpm
- Vite
- Oxfmt
- nodemon

---

## 4. Arquitectura general

La aplicación sigue una arquitectura cliente-servidor con separación clara de responsabilidades:

- Frontend: se encarga de la interfaz, navegación, formularios, validaciones y consumo de servicios.
- Backend: expone una API REST, valida autenticación y autorización, procesa reglas de negocio y conecta con SQL Server.
- Base de datos: almacena usuarios, actas, aprobaciones, notificaciones, maestros y solicitudes.

El flujo general es:

1. El usuario accede a la aplicación desde el frontend.
2. Se autentica mediante la API del backend.
3. El backend valida credenciales y emite un JWT.
4. El frontend usa el token para consumir endpoints protegidos.
5. Las operaciones de negocio se ejecutan en backend y se persisten en SQL Server.
6. Las notificaciones y aprobaciones se reflejan en la UI y se registran en historial.

---

## 5. Estructura del proyecto

```text
destruccion-gestion/
├── AGENTS.md
├── README.md
├── INICIO_RAPIDO.md
├── TODO_TASKS.md
├── index.html
├── package.json
├── pnpm-lock.yaml
├── vite.config.ts
├── tsconfig.json
├── src/
│   ├── App.tsx
│   ├── main.tsx
│   ├── routes.tsx
│   ├── index.css
│   ├── assets/
│   ├── components/
│   │   ├── layout/
│   │   └── ui/
│   ├── context/
│   │   ├── AppContext.tsx
│   │   └── AuthContext.tsx
│   ├── constants/
│   ├── data/
│   ├── pages/
│   │   ├── actas/
│   │   ├── auth/
│   │   ├── dashboard/
│   │   ├── maestros/
│   │   ├── notifications/
│   │   ├── profile/
│   │   ├── reports/
│   │   ├── search/
│   │   └── users/
│   ├── services/
│   └── types/
├── backend/
│   ├── package.json
│   ├── pnpm-lock.yaml
│   ├── README.md
│   └── src/
│       ├── server.js
│       ├── seed.js
│       ├── importZmm059.js
│       ├── controllers/
│       ├── database/
│       ├── middleware/
│       ├── routes/
│       └── services/
├── docs/
│   ├── COMO_SE_HIZO_EL_PROYECTO.md
│   ├── DOCUMENTACION_PROYECTO.md
│   └── DOCUMENTACION_COMPLETA_PROYECTO.md
└── public/
```

### Descripción de carpetas clave

#### Frontend
- `src/App.tsx`: inicializa la aplicación, tema y splash screen.
- `src/routes.tsx`: configuración central de rutas.
- `src/components/layout/`: estructura general de navegación y layout.
- `src/context/`: estado de autenticación y del negocio.
- `src/pages/`: pantallas principales del sistema.
- `src/services/api.ts`: centralización del consumo a backend.
- `src/types/`: modelos y tipos de datos.

#### Backend
- `backend/src/server.js`: arranque del servidor y configuración principal.
- `backend/src/routes/`: endpoints REST por dominio.
- `backend/src/controllers/`: lógica de cada entidad.
- `backend/src/database/`: conexión y esquema de base de datos.
- `backend/src/middleware/`: autenticación y validaciones diversas.
- `backend/src/services/`: servicios transversales como correo.

---

## 6. Roles y permisos

El sistema contempla varios roles con responsabilidades diferenciadas:

- Administrador
- Solicitante
- Aprobador de área
- Costos (se elimnara del proceso)
- HSE
- Planeación

La navegación y permisos se adaptan al tipo de usuario autenticado. En el frontend, la barra lateral y los módulos visibles se filtran según el rol. En el backend, se validan permisos por ruta mediante middleware de autorización.

Ejemplos de nivel de acceso:

- Solicitante: crea y consulta actas propias o asignadas.
- Aprobador de área: revisa actas y aprueba/rechaza según su ámbito.
- Costos: 
- HSE: valida cumplimiento de seguridad y salud.
- Planeación: administra maestros de planeación y productos INVIMA.
- Administrador: controla usuarios, configuración y supervisión general de todo el sistema.

---

## 7. Flujo de negocio principal

### 7.1 Inicio de sesión

El usuario ingresa sus credenciales en la pantalla `LoginPage`. El backend valida email/contraseña y devuelve un token JWT. El frontend guarda la sesión en el contexto de autenticación y redirige al usuario al dashboard.

### 7.2 Creación de acta

Un usuario con rol solicitante puede registrar una acta nueva. El proceso incluye:

- selección del solicitante
- clasificación de la acta
- datos del producto o material
- motivos y descripción de la destrucción
- validación de CECOs, INVIMA u otros datos maestros
- envío a proceso de aprobación

### 7.3 Estados de acta

Las actas pueden transitar por distintos estados, por ejemplo:

- borrador
- enviada
- pendiente_aprobacion_area
- pendiente_costos
- pendiente_hse
- aprobada
- rechazada
- devuelta_ajustes

### 7.4 Aprobaciones

El flujo de aprobación no es lineal siempre, sino que depende del tipo de acta y de los roles implicados. Un acta puede requerir validaciones de varios actores antes de quedar finalizada. El sistema registra cada movimiento en historial y notifica a los responsables.

### 7.5 Notificaciones

El sistema mantiene un registro de notificaciones para cada usuario, además de poder enviar correos corporativos según la configuración SMTP. Cada evento relevante puede disparar notificaciones, como:

- acta creada
- acta enviada
- aprobación o rechazo
- devolución por ajustes
- tareas pendientes

---

## 8. API REST del backend

El backend expone una API bajo el prefijo `/api`.

### Autenticación
- `POST /api/auth/login` — inicio de sesión
- `POST /api/auth/register` — registro de usuario

### Usuarios
- `GET /api/users` — listar usuarios
- `POST /api/users` — crear usuario
- `GET /api/users/:id` — consultar usuario
- `PUT /api/users/:id` — actualizar usuario
- `DELETE /api/users/:id` — eliminar usuario
- `POST /api/users/:id/test-email` — enviar correo de prueba

### Actas
- `GET /api/actas` — listar actas
- `POST /api/actas` — crear acta
- `GET /api/actas/:id` — consultar acta por id
- `PUT /api/actas/:id` — actualizar acta
- `DELETE /api/actas/:id` — eliminar acta
- `POST /api/actas/:id/submit` — enviar acta
- `POST /api/actas/:id/approve` — aprobar acta
- `POST /api/actas/:id/reject` — rechazar acta
- `POST /api/actas/:id/return` — devolver para ajustes

### Notificaciones
- `POST /api/notifications` — crear notificación
- `GET /api/notifications/user/:userId` — listar notificaciones de usuario
- `PUT /api/notifications/:id/read` — marcar notificación como leída
- `PUT /api/notifications/user/:userId/read-all` — marcar todas como leídas
- `DELETE /api/notifications/:id` — eliminar notificación

### Solicitudes
- `POST /api/solicitudes` — crear solicitud
- `GET /api/solicitudes` — listar solicitudes
- `POST /api/solicitudes/:id/approve` — aprobar solicitud
- `POST /api/solicitudes/:id/reject` — rechazar solicitud

### Maestros
- `GET /api/cecos` — consultar CECOs
- `POST /api/cecos` — crear CECO
- `PUT /api/cecos/:id` — actualizar CECO
- `DELETE /api/cecos/:id` — eliminar CECO

- `GET /api/invima` — consultar productos INVIMA
- `POST /api/invima` — crear producto INVIMA
- `PUT /api/invima/:id` — actualizar producto
- `DELETE /api/invima/:id` — eliminar producto

### Health check
- `GET /api/health` — verificar estado del backend

---

## 9. Modelo de datos

La capa de datos está construida sobre SQL Server y contiene tablas clave como:

- `users` — usuarios del sistema
- `actas` — actas de destrucción
- `acta_historial` — historial de cambios y estados
- `acta_aprobaciones` — aprobaciones por rol o área
- `notifications` — notificaciones de usuario
- `solicitudes` — registros pendientes o solicitudes de acceso
- `invima_products` — productos y catalogo INVIMA
- `cecos` — centros de costo

El backend inicializa y prepara la base de datos mediante un esquema y, cuando es necesario, via scripts de seed.

---

## 10. Seguridad

La seguridad del proyecto contempla varios mecanismos:

- Autenticación con JWT
- Cifrado de contraseñas con `bcryptjs`
- Validación de roles para acceso a módulos y rutas
- Configuración de CORS para orígenes permitidos
- Variables de entorno para credenciales y configuración sensible
- Manejo de errores centralizado en el backend

Los accesos críticos se protegen con middleware de autorización y validación del token del usuario.

---

## 11. Configuración de entorno

### Frontend
El frontend usa una variable de entorno para la URL del backend:

```env
VITE_API_URL=http://localhost:3004/api
```

### Backend
La carpeta `backend` requiere un archivo `.env` con la configuración propia del entorno, por ejemplo:

```env
PORT=3004
CORS_ORIGIN=http://localhost:5173
DB_SERVER=localhost
DB_DATABASE=destruccion_gestion
DB_USER=sa
DB_PASSWORD=TuPassword
DB_PORT=1433
JWT_SECRET=tu_clave_secreta
SMTP_HOST=smtp.corporativo.com
SMTP_PORT=587
SMTP_USER=usuario@empresa.com
SMTP_PASS=tu_contraseña
```

> Si la configuración SMTP no existe o falla, el sistema conserva la notificación en la aplicación y no bloquea el flujo de aprobación.

---

## 12. Instalación y ejecución

### Requisitos previos

- Node.js
- npm
- SQL Server disponible
- acceso a la base de datos configurada

### Frontend

```bash
cd destruccion-gestion
npm install
npm run dev
```

### Backend

```bash
cd destruccion-gestion/backend
npm install
npm run dev
 o 
npm start
```

### Producción

```bash
cd destruccion-gestion
npm run build
npm run preview
```

---

## 13. Ejecución del backend y base de datos

El backend se levanta en el puerto 3004 por defecto. En la inicialización, ejecuta:

1. Conexión a SQL Server
2. Inicialización del esquema de BD
3. Arranque del servidor Express
4. Exposición de endpoints bajo `/api`

También se incluyen scripts auxiliares como:

- `pnpm run setup-db` para sembrar datos base
- `pnpm run import-zmm059` para importar información de referencia

---

## 14. Experiencia visual y UX

La interfaz presenta una experiencia moderna con:

- layout con sidebar y dashboard
- cambio de tema claro/oscuro
- splash screen al iniciar la app
- navegación con transiciones suaves
- tarjetas, timelines y gráficos para métricas
- formularios con validación y mensajes visuales

La lógica de tema se conserva en localStorage y el sistema aplica clases `dark` al documento HTML.

---

## 15. Componentes y módulos funcionales del frontend

### Módulos principales
- `DashboardPage`: vista central con métricas y resumen
- `ActaListPage`: listado de actas
- `ActaCreatePage`: creación/edición de actas
- `ActaDetailPage`: detalle de una acta
- `AprobacionesPage`: revisión y aprobación de solicitudes
- `UserManagementPage`: administración de usuarios
- `CecosPage`: maestros de centros de costo
- `InvimaPage`: maestros de productos INVIMA
- `ReportsPage`: reportes y gráficas
- `SearchPage`: búsqueda general
- `NotificationsPage`: gestión de notificaciones
- `ProfilePage`: información del usuario

### Layout principal
- `AppLayout.tsx`: estructura general del sistema autenticado
- `Header.tsx`: cabecera con acciones y usuario
- `Sidebar.tsx`: navegación principal según el rol
- `RouteTransitionShell.tsx`: animación de transiciones de páginas

---

## 16. Estado actual del proyecto

El proyecto presenta una base funcional sólida con una separación clara entre frontend y backend. Ya incluye:

- autenticación y sesión
- gestión de usuarios
- flujo de actas y aprobaciones
- maestros y notificaciones
- dashboard y reportes
- integración con SQL Server
- configuración de correo de notificaciones

La estructura es escalable y está lista para continuar con refinamientos de negocio, validación avanzada y pruebas automáticas.

---

## 17. Buenas prácticas implementadas

- Separación clara entre UI, lógica de negocio y servicios
- Centralización de llamadas a API en `src/services`
- Uso de estados globales para contexto de negocio
- Manejo de configuración vía variables de entorno
- Persistencia de datos en backend, sin depender de `localStorage` para la información crítica
- Registro de historial y notificaciones como parte del flujo de aprobación

---

## 18. Recomendaciones futuras

1. Implementar pruebas unitarias e integradas para los flujos críticos.
2. Mejorar la validación de formularios con mensajes específicos por campo.
3. Añadir paginación y filtros avanzados en listados grandes.
4. Exportar reportes a Excel o PDF.
5. Mejorar trazabilidad por auditoría con logs más detallados.
6. Agregar gestión más granular de permisos por módulo.
7. Optimizar carga de datos y rendimiento en consultas complejas.

---



## 19. Enlaces útiles

- README del proyecto: `README.md`
- Documentación técnica previa: `docs/DOCUMENTACION_PROYECTO.md`
- Documentación de historia del proyecto: `docs/COMO_SE_HIZO_EL_PROYECTO.md`
- Backend: `backend/README.md`

---
