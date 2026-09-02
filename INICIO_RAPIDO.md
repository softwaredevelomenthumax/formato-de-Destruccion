# 🚀 INICIO RÁPIDO - Backend + SQL Server

## Paso 1: Configurar Backend

```bash
cd backend
pnpm install
```

### Crear archivo `.env`

```bash
cp .env.example .env
```

Edita `backend/.env` con tus credenciales de SQL Server:

```env
DB_SERVER=nombre-o-ip-servidor
DB_USER=sa
DB_PASSWORD=tu-contraseña
DB_DATABASE=destruccion_gestion
DB_PORT=1433
PORT=3001
CORS_ORIGIN=http://localhost:5173
JWT_SECRET=tu-clave-secreta-cambiar-en-produccion
```

### Iniciar Backend

```bash
pnpm run dev
```

✅ Backend corriendo en: `http://localhost:3001`

---

## Paso 2: Configurar Frontend

En la raíz del proyecto (no en `backend/`):

```bash
cp .env.example .env
```

El archivo `.env` debe tener:
```env
VITE_API_URL=http://localhost:3001/api
```

### Instalar y correr Frontend

```bash
pnpm install
pnpm run dev
```

✅ Frontend corriendo en: `http://localhost:5173`

---

## ✨ ¡Listo!

Ambas aplicaciones están conectadas:
- Frontend → Backend → SQL Server

**Nota:** SQL Server debe estar corriendo y accesible en la red.

---

## Comandos útiles

### Backend
```bash
cd backend
pnpm run dev        # Desarrollo con hot reload
pnpm start          # Producción
pnpm run setup-db   # Inicializar base de datos
```

### Frontend
```bash
pnpm run dev        # Desarrollo
pnpm build          # Build para producción
pnpm preview        # Ver build localmente
pnpm format         # Formatear código
```

---

## Solucionar problemas

### "Error: ECONNREFUSED"
→ Backend no está corriendo. Ejecuta `pnpm run dev` en la carpeta backend

### "CORS error" 
→ Revisa que CORS_ORIGIN en backend/.env sea `http://localhost:5173`

### "Connection Timeout"
→ SQL Server no accesible. Verifica:
- Servidor está encendido
- Usuario/contraseña correctos
- Firewall permite puerto 1433
