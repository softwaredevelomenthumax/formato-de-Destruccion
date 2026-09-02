# 📝 TAREAS PENDIENTES - Destrucción Gestión

> Estado: Configuración alineada, listo para desarrollo

---

## INICIO RÁPIDO

### Terminal 1 - Iniciar Backend
```bash
cd backend
pnpm install
pnpm run setup-db  # Solo la primera vez
pnpm run dev
```

### Terminal 2 - Iniciar Frontend  
```bash
cd ..
pnpm install
pnpm run dev
```

**Accede a:** http://localhost:5173

---

##  CONFIGURACIÓN COMPLETADA

-  `.env` creado en raíz con `VITE_API_URL=http://localhost:3001/api`
-  `backend/.env` actualizado a `PORT=3001`
-  `src/services/api.js` fallback alineado a puerto 3001
-  CORS configurado en backend para localhost:5173, localhost:8443

---

##  PRÓXIMAS TAREAS (Prioridad)

### FASE 1: Validación de Conexión (Crítico)
- [ ] Verificar SQL Server está corriendo en `localhost:1433`
- [ ] Ejecutar script de setup-db para crear esquema
- [ ] Verificar que el backend inicia sin errores en puerto 3001
- [ ] Verificar que el frontend se conecta correctamente al backend
- [ ] Probar login/registro con datos de prueba

### FASE 2: Implementación de Páginas (Importante)
- [ ] **Dashboard** - Resumen de actas (activas, completadas, pendientes)
- [ ] **Actas**
  - [ ] Listar actas con filtros
  - [ ] Crear acta (formulario multi-paso)
  - [ ] Ver detalle de acta
  - [ ] Editar acta
  - [ ] Eliminar acta
- [ ] **Aprobaciones** - Workflow de aprobación
- [ ] **Usuarios** - CRUD de usuarios (Admin)
- [ ] **Maestros**
  - [ ] CECOs
  - [ ] INVIMA
- [ ] **Reportes** - Exportar datos
- [ ] **Búsqueda** - Búsqueda global
- [ ] **Notificaciones** - Sistema de notificaciones
- [ ] **Perfil** - Datos del usuario logueado

### FASE 3: Completar Endpoints Backend (Importante)
Verificar que todos estos endpoints están implementados:

#### Auth
- [ ] POST `/api/auth/login` - Login
- [ ] POST `/api/auth/register` - Registro
- [ ] POST `/api/auth/logout` - Logout (si aplica)
- [ ] POST `/api/auth/refresh` - Refresh token (si aplica)

#### Usuarios
- [ ] GET `/api/users` - Listar usuarios
- [ ] GET `/api/users/:id` - Obtener usuario
- [ ] POST `/api/users` - Crear usuario (Admin)
- [ ] PUT `/api/users/:id` - Actualizar usuario
- [ ] DELETE `/api/users/:id` - Eliminar usuario

#### Actas
- [ ] GET `/api/actas` - Listar actas (con filtros)
- [ ] GET `/api/actas/:id` - Obtener acta
- [ ] POST `/api/actas` - Crear acta
- [ ] PUT `/api/actas/:id` - Actualizar acta
- [ ] DELETE `/api/actas/:id` - Eliminar acta
- [ ] POST `/api/actas/:id/aprobar` - Aprobar acta
- [ ] POST `/api/actas/:id/rechazar` - Rechazar acta

#### Notificaciones
- [ ] GET `/api/notifications` - Listar notificaciones
- [ ] PATCH `/api/notifications/:id/read` - Marcar como leída
- [ ] DELETE `/api/notifications/:id` - Eliminar notificación

#### INVIMA
- [ ] GET `/api/invima/productos` - Listar productos INVIMA
- [ ] POST `/api/invima/productos` - Crear producto INVIMA

#### Solicitudes
- [ ] GET `/api/solicitudes` - Listar solicitudes
- [ ] POST `/api/solicitudes` - Crear solicitud

### FASE 4: Validación y Testing (Opcional)
- [ ] Implementar validaciones Zod en formularios
- [ ] Agregar manejo de errores consistente
- [ ] Agregar loading states en las páginas
- [ ] Probar CRUD completo de actas
- [ ] Probar workflow de aprobación

### FASE 5: Deployment (Final)
- [ ] Configurar variables de entorno para producción
- [ ] Build de frontend: `pnpm build`
- [ ] Verificar build en `dist/`
- [ ] Configurar servidor de producción

---

##  HERRAMIENTAS ÚTILES

### Verificar puertos
```bash
# Windows
netstat -ano | findstr :3001
netstat -ano | findstr :5173
netstat -ano | findstr :1433
```

### Logs del Backend
```bash
# El servidor muestra logs en la terminal
# Busca "✓ Conectado a SQL Server" y "✓ Base de datos DestruccionDB lista"
```

### Base de Datos
```bash
# Recrear base de datos
cd backend
pnpm run setup-db
```

---

##  REFERENCIAS RÁPIDAS

| Componente | Ubicación | Estado |

| UI Components | `src/components/ui/` |  Listos |
| Layouts | `src/components/layout/` |  Listos |
| Pages | `src/pages/` |  Estructuradas, falta lógica |
| API Service | `src/services/api.js` |  Configurado |
| Contexts | `src/context/` |  Básicos, verificar |
| Backend Routes | `backend/src/routes/` |  Definidas, verificar |
| Controllers | `backend/src/controllers/` |  Existen, verificar |
| DB Schema | `backend/src/database/schema.js` |  Verificar completitud |

---

##  NOTAS IMPORTANTES

1. **SQL Server:** Debe estar corriendo localmente
2. **Base de datos:** Se crea automáticamente en primer startup
3. **Token JWT:** Se guarda en localStorage, se valida en cada request
4. **CORS:** Configurado para desarrollo local y Figma Make
5. **Puerto Frontend:** Por defecto Vite usa 5173
6. **Puerto Backend:** Ahora unificado a 3001

---

**Creado:** 2026-08-19    
**Próxima revisión:** Después de reunion

