# Gestión de Actas de Destrucción

Aplicación web para registrar, aprobar y consultar actas de destrucción, con frontend React/Vite y backend Node.js/Express conectado a SQL Server.

## Inicio rápido

Requisitos: Node.js 22, pnpm 10.34.3 y una instancia accesible de SQL Server.

1. Configura `backend/.env` con las credenciales de SQL Server y JWT. La plantilla disponible es [`backend/.env.example`](backend/.env.example); guarda los valores reales solo en el entorno local/seguro.
2. Instala y ejecuta el backend:

   ```bash
   cd backend
   pnpm install
   pnpm dev
   ```

3. En una terminal desde la raíz, instala y ejecuta el frontend:

   ```bash
   pnpm install
   pnpm dev
   ```

El backend usa el puerto `3004` por defecto. Para apuntar el frontend a otra dirección, define `VITE_API_URL` (o `VITE_API_BASE_URL`), por ejemplo `http://localhost:3004/api`.

## Comandos principales

| Comando | Uso |
|---|---|
| `pnpm dev` | Inicia Vite en desarrollo. |
| `pnpm build` | Genera el build del frontend. |
| `pnpm preview` | Sirve localmente el build generado. |
| `pnpm format` | Formatea el código con oxfmt. |

En `backend/`: `pnpm dev` inicia el servidor con watch, `pnpm start` lo ejecuta normalmente, `pnpm setup-db` ejecuta el seed y `pnpm import-zmm059` ejecuta el importador de datos ZMM059.

## Documentación

Consulta la [documentación técnica y funcional completa](docs/DOCUMENTACION_COMPLETA_PROYECTO.md) para arquitectura, módulos, roles, API, modelo de datos, variables de entorno, instalación, operación y límites conocidos.
