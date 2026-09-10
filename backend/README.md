# Backend - Destrucción Gestión

Backend Node.js + Express para la aplicación de gestión de actas de destrucción.

## Requisitos

- Node.js 18+
- SQL Server 2019+ (local o remoto)
- pnpm o npm

## Instalación

1. **Crear archivo `.env` con tu configuración de SQL Server:**

```bash
cd backend
cp .env.example .env
```

2. **Editar `.env` con tus credenciales:**

```env
# SQL Server
DB_HOST=tu-servidor-sql-server
DB_USER=tu-usuario
DB_PASSWORD=tu-contraseña
DB_NAME=DestruccionDB
DB_PORT=1433
DB_ENCRYPT=false
DB_TRUST_CERT=true

# Server
PORT=3001
NODE_ENV=development

# JWT
JWT_SECRET=tu-clave-secreta-muy-segura
JWT_EXPIRY=7d

# CORS
CORS_ORIGIN=http://localhost:5173
```

3. **Instalar dependencias:**

```bash
pnpm install
```

## Uso

### Desarrollo
```bash
pnpm run dev
```

El servidor correrá en `http://localhost:3001`

### Iniciar en producción
```bash
pnpm start
```

## API Endpoints

### Autenticación
- `POST /api/auth/login` - Login con usuario/contraseña
- `POST /api/auth/register` - Registrar solicitud de nuevo usuario

### Usuarios
- `GET /api/users` - Obtener todos los usuarios
- `GET /api/users/:id` - Obtener usuario específico
- `POST /api/users` - Crear usuario
- `PUT /api/users/:id` - Actualizar usuario
- `DELETE /api/users/:id` - Eliminar usuario

### Actas
- `GET /api/actas` - Obtener todas las actas
- `GET /api/actas/:id` - Obtener acta específica
- `POST /api/actas` - Crear acta
- `PUT /api/actas/:id` - Actualizar acta
- `DELETE /api/actas/:id` - Eliminar acta
- `POST /api/actas/:id/approve` - Aprobar acta

### Notificaciones
- `GET /api/notifications/user/:userId` - Obtener notificaciones del usuario
- `POST /api/notifications` - Crear notificación
- `PUT /api/notifications/:id/read` - Marcar como leída
- `PUT /api/notifications/user/:userId/read-all` - Marcar todas como leídas

### Solicitudes
- `GET /api/solicitudes` - Obtener solicitudes pendientes
- `POST /api/solicitudes` - Crear solicitud
- `POST /api/solicitudes/:id/approve` - Aprobar solicitud
- `POST /api/solicitudes/:id/reject` - Rechazar solicitud

### INVIMA
- `GET /api/invima` - Obtener productos INVIMA
- `POST /api/invima` - Crear producto
- `PUT /api/invima/:id` - Actualizar producto
- `DELETE /api/invima/:id` - Eliminar producto

## Estructura de carpetas

```
backend/
├── src/
│   ├── server.js                 # Punto de entrada
│   ├── database/
│   │   ├── connection.js         # Conexión a SQL Server
│   │   └── schema.js             # Definición de tablas
│   ├── controllers/              # Lógica de negocio
│   │   ├── usersController.js
│   │   ├── actasController.js
│   │   ├── notificationsController.js
│   │   ├── solicitudesController.js
│   │   └── invimaController.js
│   └── routes/                   # Definición de rutas
│       ├── auth.js
│       ├── users.js
│       ├── actas.js
│       ├── notifications.js
│       ├── solicitudes.js
│       └── invima.js
├── .env                          # Configuración (NO VERSIONAR)
├── .env.example                  # Ejemplo de configuración
├── package.json
└── README.md
```

## Configuración de SQL Server

### Conexión remota
El backend toma la conexión exclusivamente de las variables `DB_*` del archivo `.env`. Todas las operaciones de la API y la inicialización del esquema se ejecutan contra esa instancia. Para conectar a un SQL Server remoto, asegúrate de que:
1. El puerto 1433 esté abierto
2. Las credenciales sean correctas
3. `DB_TRUST_CERT=true` en caso de certificados auto-firmados
4. `DB_ENCRYPT=true` si el servidor exige conexión cifrada

### Crear base de datos (SQL Server Management Studio)

```sql
CREATE DATABASE destruccion_gestion;
GO
```

El backend creará o actualizará automáticamente las tablas al iniciar, pero no arranca si no puede conectarse a la base configurada.

## Notas de seguridad

⚠️ **IMPORTANTE:**
- Nunca versiones el archivo `.env` con contraseñas
- Usa contraseñas fuertes en producción
- Cambia `JWT_SECRET` a un valor seguro
- Configura CORS apropiadamente según tu dominio
- Usa HTTPS en producción
