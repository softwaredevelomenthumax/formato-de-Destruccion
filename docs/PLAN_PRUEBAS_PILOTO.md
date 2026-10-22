# Plan de pruebas — Sistema de gestión de actas de destrucción

**Periodo:** miércoles 14 al lunes 19 de octubre de 2026  
**Sistema:** aplicación web de gestión de actas de destrucción  


## 1. Objetivo

Verificar, con usuarios que representen los roles del proceso, que las funciones principales del sistema operen de principio a fin, que los datos se guarden correctamente y que los permisos, aprobaciones, consultas y reportes correspondan al flujo esperado antes de autorizar su uso operativo.

## 2. Alcance

- Inicio y cierre de sesión, navegación y permisos por rol.
- Consulta, creación, edición, envío y seguimiento de actas.
- Validación de datos de materiales, costos, causales y adjuntos.
- Aprobaciones, devoluciones y rechazos de acuerdo con el rol y el estado.
- Consulta de notificaciones e historial de cambios.
- Consulta de los maestros de CECO y materiales/INVIMA.
- Búsqueda, filtros, indicadores y exportación de reportes.
- Uso en los navegadores y tamaños de pantalla que se utilizarán en la operación.



## 4. Plan por día

| Fecha | Enfoque | Actividades y resultado esperado | Responsable sugerido |
|---|---|---|---|
| **Mié. 14 oct.** | Preparación y acceso | Reunión de inicio; confirmar URL y ambiente; verificar disponibilidad del backend y datos de prueba; comprobar que cada participante pueda ingresar con su usuario/rol; revisar navegación, cierre de sesión y acceso denegado a módulos no autorizados. Registrar bloqueos de ambiente antes de probar el flujo de negocio. | Coordinador + administrador + participantes |
| **Jue. 15 oct.** | Datos maestros y formulario | Consultar y filtrar CECO/materiales; validar que cada rol vea las opciones que le corresponden; crear un borrador de acta de prueba, recorrer sus secciones y verificar campos obligatorios, fechas, cantidades, costos, causal y resumen; guardar y volver a abrir el registro. Probar un envío con campos obligatorios incompletos y confirmar que el sistema indique qué corregir. | Solicitante + Costos + Planeación |
| **Vie. 16 oct.** | Adjuntos y envío | Completar y enviar una acta piloto con datos ficticios; adjuntar un archivo permitido y probar un formato no permitido o un archivo por encima del límite indicado en la interfaz; comprobar que el envío no pierda datos, que el consecutivo/estado se actualice y que el acta aparezca en la lista y en la bandeja del siguiente responsable. | Solicitante + aprobador de área |
| **Lun. 19 oct.** | Regresión y cierre | Repetir los casos que fallaron o fueron corregidos; verificar de nuevo los escenarios críticos de acceso, creación, envío y aprobación; consolidar resultados e incidencias; decidir **Listo para siguiente etapa**, **Listo con condiciones** o **No listo** y asignar responsables/fechas a pendientes. | Coordinador + representantes de roles |



## 6. Criterios de aceptación y decisión

El piloto se considerará **apto para pasar a la siguiente etapa** cuando:

- Todos los casos de prioridad **Alta** estén ejecutados y aprobados.
- No queden defectos críticos o altos abiertos que impidan acceso, integridad de datos, permisos o avance del proceso.
- Las rutas de aprobación, devolución y rechazo hayan sido verificadas con los roles correspondientes.
- Los datos de actas, notificaciones, indicadores y exportación sean consistentes para los registros de prueba.
- Cada incidencia abierta tenga responsable, prioridad, evidencia y fecha objetivo; las condiciones conocidas sean aceptadas explícitamente por el responsable del proceso.

**Listo para siguiente etapa:** se cumplen los criterios anteriores.  
**Listo con condiciones:** no hay bloqueos críticos/altos y las condiciones restantes tienen aceptación y responsables.  
**No listo:** falla un caso crítico, hay riesgo de acceso indebido o pérdida/alteración de datos, o no se pudo validar el flujo principal.



Severidad sugerida: **Crítica** (bloquea el proceso o compromete permisos/integridad), **Alta** (función esencial incorrecta), **Media** (afecta una función secundaria con alternativa) o **Baja** (detalle visual o de texto sin impacto operativo).

