# Frontend - Destrucción Gestión

Aplicación React + Vite para gestión de actas de destrucción, integrada con backend Node.js + SQL Server.

## Cambios de localStorage a API Backend

Esta versión del frontend ha sido migrada completamente de `localStorage` a un backend completo con base de datos SQL Server.

### Antes (localStorage)
```typescript
// Ya NO se usa
const stored = localStorage.getItem("add_actas");
const actas = stored ? JSON.parse(stored) : [];
```

### Ahora (API Backend)
```typescript
// Se usan APIs REST
const actas = await api.getActas();
const newActa = await api.createActa(data);
```

## Configuración

### 1. Crear archivo `.env`

```bash
cp .env.example .env
```

### 2. Configurar URL del API

Edita `.env`:

```env
# URL del backend (ajusta según tu configuración)
VITE_API_URL=http://localhost:3001/api
```

Para **producción**:
```env
VITE_API_URL=https://tu-dominio.com/api
```

## Instalar y ejecutar

```bash
# Instalar dependencias
pnpm install

# Modo desarrollo (requiere backend corriendo en otro terminal)
pnpm run dev

# Build para producción
pnpm build

# Preview del build
pnpm preview
```

## Requisitos previos

El **backend DEBE estar corriendo** en `http://localhost:3001` (o la URL que hayas configurado en `.env`)

### Iniciar backend (en otra terminal):

```bash
cd backend
pnpm install
pnpm run dev
```

## Cambios principales

### AppContext.tsx
- ✅ Ahora usa `api.getUsers()`, `api.createActa()`, etc.
- ✅ Las funciones retornan Promises (`async/await`)
- ✅ Sincronización automática con SQL Server
- ✅ Mejor manejo de errores

### AuthContext.tsx
- ✅ Login ahora llama a `/api/auth/login`
- ✅ Almacena token JWT para autenticación
- ✅ Validación en el backend

### Servicio de API
Archivo: [src/services/api.js](src/services/api.js)

Define todas las llamadas a la API de forma centralizada y reutilizable.

## Ejemplos de uso

### Crear acta
```typescript
const { createActa } = useApp();

await createActa({
  solicitanteId: user.id,
  solicitanteNombre: user.nombre,
  clasificacion: "producto_terminado",
  // ... resto de campos
});
```

### Obtener notificaciones
```typescript
const { loadNotifications, notifications } = useApp();

await loadNotifications(userId);
// notifications se actualiza automáticamente
```

### Aprobar acta
```typescript
const { approveActa } = useApp();

await approveActa(actaId, "area", approbador, "Aprobado");
```

## Troubleshooting

### Error: "Error conectando al servidor"
- Verifica que el backend esté corriendo
- Comprueba la URL en `.env` (VITE_API_URL)
- Revisa la consola del navegador (F12) para más detalles

### Error: "CORS error"
- Asegúrate que CORS_ORIGIN en backend/.env coincide
- Ejemplo: `CORS_ORIGIN=http://localhost:5173`

### Las notificaciones no se actualizan
- Llama a `loadNotifications(userId)` después de cambios
- El estado se actualiza automáticamente

## Estructura de datos

Los datos ahora se persisten en SQL Server con estas tablas:
- `users` - Usuarios del sistema
- `actas` - Actas de destrucción
- `acta_historial` - Historial de cada acta
- `acta_aprobaciones` - Estados de aprobación
- `notifications` - Notificaciones de usuarios
- `solicitudes` - Solicitudes de registro pendientes
- `invima_products` - Productos INVIMA

Consulta `backend/README.md` para más información.
