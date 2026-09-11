
# Backend — Gestión de Actas

## Correos automáticos

Las notificaciones del sistema también se envían por correo a cualquier usuario **activo** que tenga un correo corporativo registrado, sin importar su rol. Esto cubre aprobadores de área, Costos, HSE, Planeación, solicitantes y administradores cuando reciban una notificación.

1. Copie `.env.example` como `.env` dentro de esta carpeta.
2. Complete los datos SMTP corporativos: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER` y `SMTP_PASS`.
3. Reinicie el backend.

Si la configuración SMTP no existe o un envío falla, la notificación seguirá disponible dentro de la aplicación; el flujo de aprobación no se detiene.
