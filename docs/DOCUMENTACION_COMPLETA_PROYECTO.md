# Documentación técnica y funcional

## Sistema de Gestión de Actas de Destrucción

Este documento describe las funcionalidades, arquitectura, configuración y operación que están implementadas actualmente en el repositorio. Cuando una capacidad está incompleta o no está conectada, se indica explícitamente para no confundirla con una función disponible.

## 1. Propósito y alcance

La aplicación web centraliza el registro y seguimiento de actas de destrucción de materiales. Incluye módulos para autenticación, creación y consulta de actas, aprobaciones, usuarios, solicitudes de registro, catálogos de CECO e INVIMA, notificaciones, búsqueda y reportes.

La solución tiene dos componentes:

- **Frontend:** aplicación React que presenta los módulos y consume la API.
- **Backend:** API REST con Express que aplica operaciones de negocio y persiste información en SQL Server.

El código también contiene una tabla y un router para códigos SAP. Aunque el router existe en `backend/src/routes/sap.js`, actualmente no está montado en `backend/src/server.js`; por eso no se documenta como endpoint operativo.

## 2. Tecnologías y herramientas

| Área | Tecnología |
|---|---|
| Interfaz | React 19, TypeScript y React Router |
| Desarrollo y build web | Vite 8 |
| Estilos | Tailwind CSS v4 |
| Formularios y validación | React Hook Form y Zod |
| Gráficos y animaciones | Recharts y Framer Motion |
| Iconos y mensajes | Lucide React y Sonner |
| API | Node.js, Express 4 y JavaScript ES modules |
| Persistencia | Microsoft SQL Server mediante `mssql` |
| Autenticación | JWT y bcryptjs |
| Correo | Nodemailer |
| Importación de hojas de cálculo | `xlsx` |
| Administrador de paquetes configurado | pnpm |
| Formateador | oxfmt |

Las versiones declaradas y los comandos se encuentran en los `package.json` de la raíz y de `backend/`. `.mise.toml` especifica Node.js 22 y pnpm 10.34.3.

## 3. Estructura del repositorio

```text
.
├── README.md
├── INICIO_RAPIDO.md
├── package.json
├── vite.config.ts
├── src/
│   ├── App.tsx
│   ├── main.tsx
│   ├── routes.tsx
│   ├── context/
│   │   ├── AppContext.tsx
│   │   └── AuthContext.tsx
│   ├── components/
│   │   ├── layout/
│   │   └── ui/
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
│   ├── services/api.ts
│   └── types/
├── backend/
│   ├── package.json
│   ├── .env.example
│   └── src/
│       ├── server.js
│       ├── controllers/
│       ├── database/
│       ├── middleware/
│       ├── routes/
│       └── services/
└── docs/
    ├── COMO_SE_HIZO_EL_PROYECTO.md
    ├── DOCUMENTACION_PROYECTO.md
    └── DOCUMENTACION_COMPLETA_PROYECTO.md
```

### Archivos principales

- `src/main.tsx`: monta la aplicación React y carga los estilos globales.
- `src/App.tsx`: combina los proveedores de autenticación y estado, y configura el tema inicial.
- `src/routes.tsx`: define las rutas de las páginas.
- `src/context/AuthContext.tsx`: administra el usuario, token, login, cierre de sesión y renovación de sesión.
- `src/context/AppContext.tsx`: centraliza la carga y actualización del estado funcional del frontend.
- `src/services/api.ts`: centraliza las solicitudes HTTP al backend.
- `src/types/index.ts`: define los modelos y tipos usados por la interfaz.
- `backend/src/server.js`: configura Express, CORS, health check y montaje de rutas; conecta a la base de datos antes de escuchar.
- `backend/src/database/connection.js`: configura el pool de SQL Server.
- `backend/src/database/schema.js`: crea tablas y aplica ajustes de esquema al iniciar.
- `backend/src/middleware/auth.js`: verifica tokens, estado activo y roles en las rutas que lo usan.
- `backend/src/services/emailService.js`: gestiona el envío de correo.

## 4. Módulos funcionales

| Módulo | Ruta de interfaz | Función |
|---|---|---|
| Inicio de sesión | `/login` | Autenticación con usuario y contraseña; puede ofrecer acceso de prueba si el backend lo habilita. |
| Registro | `/registro` | Envía una solicitud de registro para aprobación. |
| Dashboard | `/dashboard` | Resumen e indicadores principales. |
| Actas | `/actas` | Consulta de actas. |
| Crear acta | `/actas/nueva` | Captura un borrador/acta nueva. |
| Detalle de acta | `/actas/:id` | Consulta el detalle, aprobaciones e historial de un acta. |
| Editar acta | `/actas/:id/editar` | Reutiliza el formulario de creación en modo edición. |
| Aprobaciones | `/aprobaciones` | Revisión de pendientes según el rol y el paso asignado. |
| Usuarios | `/usuarios` | Administración de usuarios. |
| CECOs | `/maestros/cecos` | Consulta y mantenimiento del catálogo de centros de costo. |
| INVIMA | `/maestros/invima` | Consulta y mantenimiento del catálogo de productos/registros INVIMA. |
| Reportes | `/reportes` | Indicadores y visualizaciones. |
| Búsqueda | `/busqueda` | Búsqueda de información del sistema. |
| Notificaciones | `/notificaciones` | Consulta y gestión de notificaciones del usuario. |
| Perfil | `/perfil` | Consulta o edición de información del perfil. |

La ruta `/` redirige a `/dashboard`; las rutas no reconocidas también redirigen allí. `AppLayout` contiene la navegación de la aplicación. El router define las páginas, pero no incluye por sí mismo una guarda de autenticación; las restricciones de API se aplican en el backend según cada ruta.

## 5. Roles

Los roles tipados en el frontend son:

- `administrador`
- `admin_global`
- `solicitante`
- `aprobador_area`
- `costos`
- `hse`
- `validaciones`
- `planeacion`
- `lab_calidad`

El backend normaliza algunos alias: `admin` se interpreta como `administrador`; `administrador_global` y `global_admin` se interpretan como `admin_global`. Los endpoints que requieren rol vuelven a comprobar que la cuenta exista y esté activa.

La navegación puede mostrar módulos de acuerdo con el rol, pero la autorización efectiva debe considerarse únicamente donde el backend usa `requireRole`. La matriz de la sección de API describe las restricciones registradas en las rutas.

## 6. Flujo de negocio de actas

1. Un usuario inicia sesión y obtiene un JWT.
2. El solicitante crea el acta y puede conservarla como borrador.
3. Al enviarla, el backend inicia los pasos de aprobación aplicables y registra cambios en el historial.
4. Los aprobadores actúan sobre el paso que tienen asignado. El backend comprueba rol y, cuando aplica, que el usuario corresponda al aprobador asignado.
5. Las decisiones actualizan estado/aprobación y pueden generar notificaciones internas y correos.
6. Una devolución permite solicitar ajustes; el rechazo finaliza el flujo como rechazada.

Los estados reconocidos por los tipos del frontend son:

`borrador`, `creada`, `enviada`, `pendiente_aprobacion_material`, `pendiente_aprobacion_area`, `pendiente_costos`, `pendiente_hse`, `pendiente_validaciones`, `devuelta_ajustes`, `rechazada`, `aprobada` y `cerrada`.

El flujo vigente se configura en el controlador de actas y el esquema de base de datos. En el envío se inician pasos de aprobación de materiales, área y HSE; costos y validaciones pueden marcarse como `no_aplica` según la operación. El esquema también migra actas antiguas de `pendiente_aprobacion_material` a `pendiente_aprobacion_area` y elimina aprobaciones del paso `material_costos`. Antes de desplegar cambios de esquema en una base con datos reales, realizar respaldo y validar las migraciones.

## 7. API REST

La base de la API es `/api`. El backend escucha en el puerto `3004` por defecto y publica `GET /api/health`.

### Autenticación

| Método | Endpoint | Acceso registrado | Descripción |
|---|---|---|---|
| GET | `/api/auth/users` | Sin token | Devuelve los nombres de usuario activos y si está habilitado el login de desarrollo local. |
| POST | `/api/auth/dev-login` | Solo desarrollo, flag habilitado y conexión loopback | Login de prueba sin contraseña. No se habilita en producción. |
| POST | `/api/auth/login` | Sin token | Valida usuario/contraseña y devuelve JWT y datos del usuario. |
| POST | `/api/auth/refresh` | Requiere token en la cabecera HTTP de autorización con esquema Bearer | Renueva token y datos desde el usuario activo en la base de datos. |
| POST | `/api/auth/register` | Sin token | Crea una solicitud de registro pendiente. |

### Actas

| Método | Endpoint | Roles requeridos | Descripción |
|---|---|---|---|
| GET | `/api/actas` | Todos los roles funcionales | Lista actas. |
| GET | `/api/actas/:id` | Todos los roles funcionales | Obtiene el detalle de un acta. |
| POST | `/api/actas` | `admin_global`, `solicitante` | Crea un acta. |
| PUT | `/api/actas/:id` | `admin_global`, `solicitante`, `aprobador_area`, `hse`, `planeacion` | Actualiza un acta. |
| DELETE | `/api/actas/:id` | `admin_global` | Elimina un acta. |
| POST | `/api/actas/:id/submit` | `solicitante` | Envía el acta al flujo de revisión. |
| POST | `/api/actas/:id/approve` | `aprobador_area`, `costos`, `hse`, `validaciones`, `planeacion`, `lab_calidad` | Aprueba el paso correspondiente. |
| POST | `/api/actas/:id/reject` | `aprobador_area`, `costos`, `hse`, `planeacion`, `lab_calidad` | Rechaza el acta. |
| POST | `/api/actas/:id/return` | `aprobador_area`, `costos`, `hse`, `validaciones`, `planeacion`, `lab_calidad` | Devuelve el acta para ajustes. |
| PATCH | `/api/actas/:id/validation-weight` | `validaciones` | Actualiza la ponderación/dato de validación. |
| POST | `/api/actas/:id/notify-hse` | `administrador`, `admin_global`, `aprobador_area` | Reenvía aviso al equipo HSE. |
| POST | `/api/actas/:id/notify-area-approver` | `administrador`, `admin_global`, `aprobador_area`, `hse` | Reenvía aviso al aprobador de área. |

Los roles de consulta son `administrador`, `admin_global`, `solicitante`, `aprobador_area`, `costos`, `hse`, `validaciones`, `planeacion` y `lab_calidad`.

### Usuarios

Todos los endpoints de usuarios listados requieren `administrador` o `admin_global`.

| Método | Endpoint | Descripción |
|---|---|---|
| GET | `/api/users` | Lista usuarios. |
| GET | `/api/users/:id` | Consulta un usuario. |
| POST | `/api/users` | Crea un usuario. |
| PUT | `/api/users/:id` | Actualiza un usuario. |
| DELETE | `/api/users/:id` | Elimina un usuario. |
| POST | `/api/users/:id/test-email` | Envía un correo de prueba. |

### Solicitudes de registro

| Método | Endpoint | Acceso registrado |
|---|---|---|
| POST | `/api/solicitudes` | Sin middleware de rol en la ruta |
| GET | `/api/solicitudes` | Sin middleware de rol en la ruta |
| POST | `/api/solicitudes/:id/approve` | Sin middleware de rol en la ruta |
| POST | `/api/solicitudes/:id/reject` | Sin middleware de rol en la ruta |

El registro público del usuario también se realiza con `POST /api/auth/register`. Verificar las restricciones de acceso de estas operaciones antes de exponer el backend a una red no confiable.

### Notificaciones

| Método | Endpoint | Acceso registrado |
|---|---|---|
| GET | `/api/notifications/user/:userId` | Sin middleware de rol en la ruta |
| POST | `/api/notifications` | Sin middleware de rol en la ruta |
| PUT | `/api/notifications/:id/read` | Sin middleware de rol en la ruta |
| PUT | `/api/notifications/user/:userId/read-all` | Sin middleware de rol en la ruta |
| DELETE | `/api/notifications/:id` | Sin middleware de rol en la ruta |

### Catálogos

| Método | Endpoint | Roles requeridos | Descripción |
|---|---|---|---|
| GET | `/api/cecos` | Sin middleware de rol en la ruta | Lista centros de costo. |
| POST | `/api/cecos` | `costos` | Crea un CECO. |
| PUT | `/api/cecos/:id` | `costos` | Actualiza un CECO. |
| DELETE | `/api/cecos/:id` | `costos` | Elimina un CECO. |
| GET | `/api/invima` | Sin middleware de rol en la ruta | Lista productos INVIMA. |
| POST | `/api/invima` | `planeacion` | Crea un producto INVIMA. |
| PUT | `/api/invima/:id` | `planeacion` | Actualiza un producto INVIMA. |
| DELETE | `/api/invima/:id` | `planeacion` | Elimina un producto INVIMA. |

`GET /api/health` es un endpoint de estado y devuelve un JSON con el estado del backend. Aunque hay un router para `/api/sap`, el servidor no lo monta; sus rutas no están disponibles mediante este servidor en su estado actual.

Las solicitudes HTTP se realizan desde `src/services/api.ts`. En las llamadas autenticadas, el token se envía en la cabecera HTTP de autorización con esquema Bearer.

## 8. Modelo de datos

La base se inicializa en `backend/src/database/schema.js`. El backend crea las tablas que no existen y agrega algunas columnas faltantes a tablas existentes.

| Tabla | Propósito y datos representativos |
|---|---|
| `users` | Cuenta, nombre de usuario, contraseña cifrada, nombre, email, área, rol, estado y fechas. |
| `actas` | Consecutivo, solicitante, estado, empresa, área, fechas, causal, CECO, datos del material, observaciones, adjuntos y referencias a catálogos. |
| `acta_materiales` | Detalle de materiales asociados: descripción, SAP, lote, orden, clasificación, cantidades, peso y costos. |
| `acta_historial` | Usuario, fecha/hora, equipo y acción registrada para un acta. |
| `acta_aprobaciones` | Paso, estado, aprobador, comentario, motivo y ajustes de cada aprobación. |
| `notifications` | Destinatario, título, mensaje, tipo, lectura, fecha y referencia opcional al acta. |
| `solicitudes` | Datos del registro solicitado, rol solicitado, estado y fecha. |
| `invima_products` | Catálogo de productos y datos regulatorios, empresa, estado, presentación y atributos de producto. |
| `sap_codes` | Códigos SAP relacionados opcionalmente con un producto INVIMA. El router API asociado no está montado actualmente. |
| `cecos` | Empresa, código CECO, denominación, responsable, departamento, tipo de costo, moneda y estado. |

Relaciones declaradas por el esquema:

- Un usuario puede ser solicitante de actas; `actas.solicitanteId` referencia `users.id`.
- El historial, los materiales y las aprobaciones referencian `actas.id`.
- Las notificaciones referencian `users.id`.
- Los códigos SAP pueden referenciar `invima_products.id`.
- `cecos` tiene identificador y restricción única por pareja `empresaCode`/`ceco`.

Las tablas de historial y aprobaciones usan identificadores de acta, pero el esquema no declara una clave foránea de notificación desde `notifications.actaId`. Los detalles completos y tipos de columnas se pueden consultar en el archivo de esquema.

## 9. Configuración por entorno

No copiar secretos al repositorio ni a esta documentación. Crear/configurar los archivos de entorno localmente y mantener contraseñas, tokens y credenciales bajo gestión segura.

### Frontend

El servicio acepta, en este orden, `VITE_API_BASE_URL` o `VITE_API_URL`. Si no se define ninguna, usa la dirección del host actual con el puerto `3004` y el prefijo `/api`.

Ejemplo para desarrollo:

```env
VITE_API_URL=http://localhost:3004/api
```

Las variables `VITE_*` se incluyen en el bundle web; no deben contener claves secretas.

### Backend

El backend carga `backend/.env` mediante dotenv. Las variables reconocidas incluyen:

| Variable | Uso |
|---|---|
| `PORT` | Puerto HTTP; valor predeterminado `3004`. |
| `CORS_ORIGIN` | Orígenes permitidos adicionales; acepta una lista separada por comas. |
| `DB_HOST` / `DB_SERVER` | Host de SQL Server; predeterminado `localhost`. |
| `DB_PORT` | Puerto SQL Server; predeterminado `1433`. |
| `DB_NAME` / `DB_DATABASE` | Base de datos; predeterminado `DestruccionDB`. |
| `DB_USER` | Usuario de la base; predeterminado `sa`. |
| `DB_PASSWORD` | Contraseña de SQL Server. |
| `DB_ENCRYPT` | Habilita cifrado de conexión (`true`, `1` o `yes`). |
| `DB_TRUST_CERT` | Confía en el certificado del servidor; predeterminado `true`. |
| `DB_CONNECTION_TIMEOUT` | Tiempo de conexión en ms; predeterminado `15000`. |
| `DB_REQUEST_TIMEOUT` | Tiempo máximo de consulta en ms; predeterminado `30000`. |
| `DB_POOL_MAX` | Máximo de conexiones del pool; predeterminado `30`. |
| `JWT_SECRET` | Secreto de firma JWT. Configurar un valor fuerte y privado. |
| `JWT_EXPIRY` | Duración de JWT; predeterminado `7d`. |
| `NODE_ENV` | Entorno; el login de desarrollo no funciona en `production`. |
| `ENABLE_DEV_LOGIN` | Solo el valor `true` permite login de prueba, además de requerir entorno no productivo y conexión loopback. |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE` | Servidor y modo de conexión SMTP. |
| `SMTP_USER`, `SMTP_PASS` | Credenciales SMTP. |
| `MAIL_FROM` | Remitente visible; si se omite, se usa `SMTP_USER`. |
| `APP_BASE_URL` | Dirección base de la aplicación usada en comunicaciones. |

`backend/.env.example` contiene una plantilla de correo y valores de ejemplo de puerto/origen. La conexión a SQL Server y el JWT deben configurarse según el entorno. El código conserva un secreto JWT de fallback para desarrollo; definir `JWT_SECRET` explícitamente es requisito operativo para despliegues.

### CORS

El servidor permite los orígenes configurados en `CORS_ORIGIN` y una lista de orígenes locales/de desarrollo. Además, actualmente acepta orígenes HTTP con dirección IPv4 y puerto `8443`. Revisar y limitar esa política conforme a los dominios reales de cada ambiente.

## 10. Instalación y ejecución

### Requisitos

- Node.js 22 y pnpm 10.34.3, de acuerdo con `.mise.toml`.
- SQL Server accesible desde el backend.
- Variables de entorno del backend configuradas.

### Frontend

Desde la raíz:

```bash
pnpm install
pnpm run dev
```

Vite expone el servidor en `0.0.0.0`; la URL local normalmente se muestra en la terminal. Para generar y servir el build:

```bash
pnpm run build
pnpm run preview
```

### Backend

En otra terminal:

```bash
cd backend
pnpm install
pnpm run dev
```

El comando `pnpm start` ejecuta el backend sin modo watch. En el arranque, el servidor conecta a SQL Server, inicializa/ajusta el esquema y después empieza a escuchar.

### Scripts disponibles

| Directorio | Comando | Propósito |
|---|---|---|
| raíz | `pnpm dev` | Servidor Vite de desarrollo. |
| raíz | `pnpm build` | Build de producción del frontend. |
| raíz | `pnpm preview` | Vista previa local del build. |
| raíz | `pnpm format` | Formatea con oxfmt. |
| `backend/` | `pnpm dev` | Backend con reinicio al detectar cambios. |
| `backend/` | `pnpm start` | Backend normal. |
| `backend/` | `pnpm setup-db` | Ejecuta `src/seed.js` para datos de inicialización. |
| `backend/` | `pnpm import-zmm059` | Ejecuta el importador de la hoja ZMM059. |

Los scripts de seed e importación deben ejecutarse de forma intencional contra la base correcta. No son necesarios para que el servidor cree las tablas; revisar sus archivos antes de usar datos productivos.

## 11. Persistencia de sesión y presentación

- El token y el usuario autenticado se guardan en `sessionStorage`, por lo que la sesión se limita a la sesión del navegador/tab.
- La clave de tema del frontend es `add-theme`; la preferencia se lee desde `localStorage` y puede respetar la preferencia del sistema si no se ha guardado una.
- La información funcional de actas y usuarios se obtiene del backend; el estado en React sirve para compartir datos entre pantallas.
- El backend usa JSON con un límite de cuerpo de solicitud de 50 MB.
- Ciertos correos son opcionales: la falta o falla de SMTP no debería detener el flujo de aprobación; revisar la configuración y los logs para confirmar entregas.

## 12. Seguridad y operación

- Las contraseñas de usuarios se verifican con bcryptjs; el registro cifra la contraseña antes de guardar la solicitud.
- Las rutas que usan `requireRole` exigen JWT válido, usuario existente y estado activo.
- La autorización no está aplicada uniformemente a todos los routers: revisar en particular solicitudes, notificaciones y consultas de los catálogos, que actualmente no usan middleware de rol en sus declaraciones de ruta.
- El secreto JWT de desarrollo por defecto no debe utilizarse en producción.
- Mantener las credenciales fuera del control de versiones; no incluir valores reales en ejemplos, logs compartidos o documentación.
- Configurar `CORS_ORIGIN` con orígenes controlados y revisar las reglas adicionales codificadas en el servidor antes del despliegue.
- Proteger SQL Server con controles de red, credenciales con privilegios mínimos, cifrado cuando corresponda y copias de seguridad.
- Las inicializaciones de esquema incluyen transformaciones de estados/aprobaciones. Realizar backup y probar una actualización en un entorno de ensayo antes de iniciar una versión sobre datos reales.
- Los errores del servidor se registran en consola y se responden como JSON; revisar los logs del proceso y la conectividad de SQL Server ante fallas de arranque.

## 13. Comprobación y solución de problemas

### El frontend no conecta con la API

1. Confirmar que el backend está iniciado y que SQL Server está disponible.
2. Abrir `GET http://localhost:3004/api/health` en el entorno local.
3. Revisar `VITE_API_URL`/`VITE_API_BASE_URL`, incluyendo el sufijo `/api`.
4. Revisar la configuración CORS para el origen desde el cual se sirve la interfaz.

### Error al iniciar el backend

- Validar host, puerto, base, usuario y contraseña de SQL Server.
- Confirmar que la base existe y el usuario tiene permisos para crear/alterar las tablas requeridas.
- Revisar los mensajes de inicio de `backend/src/database/connection.js` y `backend/src/database/schema.js`.

### Error 401 o 403

- 401 indica token ausente/inválido/expirado o cuenta inactiva.
- 403 indica que el rol actual no está autorizado para esa operación o que el usuario no tiene asignado el paso correspondiente.
- Cerrar sesión e iniciar sesión nuevamente si el rol cambió.

### Correo no enviado

- Revisar host, puerto, seguridad, usuario y clave SMTP.
- Validar el remitente y la política del servidor corporativo.
- Consultar los logs del backend; la notificación interna puede mantenerse aun cuando falle el correo.

## 14. Límites y aspectos a confirmar

Estos puntos describen el estado observado en el código; no son promesas de funcionalidad:

1. El router `/api/sap` no está montado en el servidor actual.
2. Algunas operaciones de solicitudes, notificaciones y lecturas de catálogos no declaran middleware de autenticación/rol en sus rutas.
3. El router web no incluye un guard global para bloquear páginas por falta de sesión; debe confirmarse el comportamiento de acceso esperado para cada página.
4. El esquema se inicializa con SQL y también contiene migraciones de compatibilidad/estado. No usar como sustituto de un proceso formal de migración y respaldo.
5. Los `package.json` no definen scripts de pruebas automatizadas.
6. Los archivos de hojas de cálculo en la raíz y el importador ZMM059 son insumos de negocio; validar su origen, estructura y tratamiento antes de importar en una base compartida.

## 15. Referencias del repositorio

- [README principal](../README.md)
- [Inicio rápido](../INICIO_RAPIDO.md)
- [Documentación funcional previa](./DOCUMENTACION_PROYECTO.md)
- [Historia y decisiones del proyecto](./COMO_SE_HIZO_EL_PROYECTO.md)
- [Configuración de ejemplo del backend](../backend/.env.example)
