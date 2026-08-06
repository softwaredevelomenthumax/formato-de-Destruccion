El proyecto corresponde a un sistema empresarial para Humax Pharmaceutical llamado:
Sistema de Gestión de Actas de Destrucción (ADD)
El objetivo es reemplazar completamente el proceso manual realizado mediante el formulario físico FORMHUM000192.
El sistema debe estar pensado para producción, con arquitectura escalable, código limpio, componentes reutilizables, validaciones robustas, excelente experiencia de usuario y apariencia moderna.
Si existe alguna duda entre dos decisiones, siempre implementa la solución más profesional.
________________________________________
TECNOLOGÍAS
Frontend
•	React
•	TypeScript
•	TailwindCSS
•	Vite
•	React Router
•	React Hook Form
•	Zod
•	TanStack Query
•	React Table
•	Framer Motion
•	Lucide React
•	Sonner
•	date-fns
Backend
•	NodeJS
•	Express
•	TypeScript
•	MSSQL
•	JWT
•	Multer
•	Nodemailer
Base de datos
SQL Server
________________________________________
DISEÑO
Debe verse como un software empresarial.
Inspirarse en
•	SAP Fiori
•	Microsoft Fluent
•	Notion
•	Stripe Dashboard
•	Linear
•	Atlassian
responsive
________________________________________
LOGIN
Debe incluir
Logo
Nombre del sistema
Descripción
Usuario
Contraseña
Mostrar contraseña
Recordarme
Validaciones
No permitir ingresar si el usuario no está aprobado.
________________________________________
REGISTRO
El registro debe solicitar
Usuario
Contraseña
Confirmar contraseña
Área
Rol solicitado
Correo corporativo (únicamente para rolea diferentes a solicitante)
Botón solicitar acceso
Al terminar
No crea el usuario.
Genera una solicitud pendiente.
El administrador decide si aprueba.
________________________________________
ROLES
Administrador
Solicitante
Aprobador Área
Costos
HSE
Planeación
Cada rol debe tener permisos completamente independientes.
No permitir acceder a pantallas mediante URL.
Todo debe protegerse desde backend y frontend.
________________________________________
DASHBOARD
Crear dashboard diferente para cada rol.
Administrador
Usuarios pendientes
Actas
Pendientes
Aprobadas
Rechazadas
Indicadores
Gráficos
Actividad reciente
Solicitante
Mis actas
Borradores
Pendientes
Rechazadas
Aprobadas
Tiempo promedio
Aprobador
Solicitudes pendientes
Tiempo de aprobación
Cantidad aprobadas
Cantidad rechazadas
________________________________________
GESTIÓN DE USUARIOS
Administrador
Debe poder
Crear
Editar
Eliminar
Activar
Desactivar
Aprobar solicitudes
Rechazar solicitudes
Cambiar roles
Restablecer contraseña
Buscar usuarios
Filtros
Área
Rol
Estado
Correo
Usuario
________________________________________
CREACIÓN DE ACTAS
Únicamente el solicitante puede crear actas.
Organizada por pasos.
Usar Stepper.
Paso 1
Información General
Empresa
Humax
Farmatech
Cambridge
Centro de costos
Fecha
Solicitante
Responsable
Área
________________________________________
Paso 2
Información del material
Descripción
Código SAP
Número lote
Orden producción
Sustancia controlada
Sí
No
Clasificación
Materia Prima
Producto Semiterminado
Granel
Producto Terminado
Material Empaque
Reactivos
Remanentes
Muestras
Otro
Fecha vencimiento
Registro INVIMA
________________________________________
Paso 3
Información económica
Peso Kg
Cantidad unidades
Costo destrucción
________________________________________
Paso 4
Causal
Las causales deben mostrarse como tarjetas.
Cada tarjeta debe contener
Icono
Título
Descripción
Cuando el usuario seleccione una causal
Debe abrir un modal.
En el modal explicar
Qué significa
Cuándo aplica
Ejemplos
Preguntar
¿Está seguro que esta es la causal correcta?
Botones
Cancelar
Continuar
Si selecciona "Otras"
Debe aparecer inmediatamente un campo obligatorio para escribir la explicación.
________________________________________
Las causales son
Material vencido
Producto no conforme
Residuos proceso
Contaminación
Daño operativo
Remanentes
Producto retirado
Otras
________________________________________
Paso 5
Observaciones
Adjuntos
Documentos soporte
________________________________________

Paso 6
Resumen
Mostrar toda la información.
Botón Guardar borrador
Botón Enviar a aprobación
________________________________________
ESTADOS
Debe existir
Borrador
Creada
Enviada
Pendiente aprobación área
Pendiente costos
Pendiente HSE
Devuelta para ajustes
Rechazada
Aprobada
Cerrada
El solicitante
No puede editar una enviada.
Solo puede editar cuando sea devuelta.
________________________________________
FLUJO DE APROBACIÓN
Solicitante
↓
Aprobador Área
↓
Si requiere costos
↓
Costos
↓
HSE
↓
Finalizada
________________________________________
CONDICIONES(aun por definir bien)
La condición para pasar por costos es
Producto terminado menor a un año
Materia prima menor seis meses
Material reutilizable
Eventos calidad
En caso contrario
Va directamente a HSE.
________________________________________
APROBADORES
Cada aprobador puede
Aprobar
Rechazar
Solicitar ajustes
Cuando rechaza
Debe ser obligatorio escribir el motivo.
Cuando solicita ajuste
Debe indicar
Campo
Corrección
Comentario
Notificar automáticamente.
________________________________________
HISTORIAL
Toda modificación debe registrar
Usuario
Fecha
Hora
Equipo
Acción
Campo
Valor anterior
Valor nuevo
Nunca borrar historial.
________________________________________
NOTIFICACIONES
Enviar correo automáticamente cuando
Usuario aprobado
Usuario rechazado
Acta enviada
Acta aprobada
Acta rechazada
Acta devuelta
Pendiente aprobación
Recordatorios
También mostrar notificaciones dentro del sistema.
________________________________________
MAESTROS
Crear módulos independientes.
Centro Costos
Empresa
Descripción
Área
Responsable
Departamento
Moneda
Estado
INVIMA
Producto
Registro
Estado
Titular
Tipo medicamento
Cada módulo
CRUD completo.
________________________________________
REPORTES
Crear reportes
Por
Fecha
Producto
Lote
Área
Empresa
Causal
Material
Estado
Costo
Peso
Aprobador
Tiempo aprobación
Pendientes
Aprobadas
Rechazadas
Exportar
Excel
PDF
________________________________________
BÚSQUEDA
Buscador global.
Debe permitir buscar por
Consecutivo
Fecha
Solicitante
Empresa
Área
Producto
SAP
INVIMA
Centro costos
Lote
Orden
Estado
Peso
Costo
Rangos
________________________________________
TABLAS
Todas las tablas deben incluir
Ordenamiento
Filtros
Columnas configurables
Paginación
Exportar
Búsqueda rápida
Acciones
Hover
Badges
Estados por color
________________________________________
VALIDACIONES
Todos los campos obligatorios.
No permitir enviar si falta alguno.
Validar
Correo
Fechas
Números
Peso
Costo
Lotes
Código SAP
INVIMA
________________________________________
REGLAS DE NEGOCIO
Cumplir estrictamente
Un usuario nunca aprueba su propia solicitud.
Toda devolución requiere observación.
Toda aprobación registra fecha.
Una aprobada no puede editarse.
Una cerrada no puede eliminarse.
Consecutivo único.
No duplicar consecutivos.
No eliminar usuarios con actas activas.
Correos automáticos.
Historial obligatorio.
Campos obligatorios bloquean envío.
________________________________________
________________________________________
EXPERIENCIA DE USUARIO
Agregar
Tooltips
Confirmaciones
Modales
Snackbars
Skeletons
Loading
Empty States
Error States
Drag & Drop para archivos
Animaciones suaves
Transiciones
Breadcrumbs
Cards
Badges
Progress Bars
Timeline del flujo de aprobación
Indicador visual del estado del proceso
Indicador de porcentaje completado mientras se diligencia el acta
________________________________________
SEGURIDAD
JWT
Refresh Token
Protección por Roles
Protección por Permisos
Validaciones Backend
Validaciones Frontend
Sanitización
Rate Limit
Logs

CÓDIGO
proyecto profesional.
No generar archivos gigantes.
Separar responsabilidades.
Componentes reutilizables.
Hooks personalizados.
Servicios.
Context.
Tipos.
Constantes.
Helpers.
Validaciones.
Arquitectura limpia.
________________________________________
MUY IMPORTANTE
No omitir absolutamente ningún requerimiento del documento de levantamiento.
Antes de generar cualquier pantalla, analizar todos los requerimientos funcionales, reglas de negocio, estados, flujo de aprobación, permisos y validaciones.
Cuando implemente una funcionalidad, asegúrarse de que respete el flujo completo del negocio y no solo el diseño visual.
Cada pantalla debe sentirse intuitivo, rápido y listo para ser utilizado en producción dentro de una compañía. Además, revisar continuamente que ningún requisito del documento quede sin implementar o sin considerar durante el desarrollo.

 
Dejar el maestro del Invima temporal

El de productos si se debe traer.
Que ponga el nombre de un producto y seleccione si hay diferentes presentaciones con el mismo nombre y así.
Etc etc.
Los cecos se siguen filtrando por empresa.

DOCUMENTO DE LEVANTAMIENTO DE REQUISITOS
INFORMACIÓN GENERAL
Nombre del Proyecto: Sistematización de actas de destrucción 
Versión del Documento: 1
1. OBJETIVO DEL PROYECTO
Sistematizar el FORMHUM000192 relacionado con acta de destrucción de materiales, para facilitar la trazabilidad en la búsqueda de información de materiales destruidos y minimizar el consumo de papel.
2. DESCRIPCIÓN DEL PROCESO ACTUAL
El área generadora de residuos diligencia el FORMHUM000192 recopilando información sobre el o los productos a destruir: No. Lote, fecha, responsable, Orden de producción, fecha de vencimiento, Compañía, código del producto, No de unidades, Centro de costos, costo de la destrucción, kg, registro Invima, observaciones y firmas (área generadora, supervisor o gerente, HSE & S y costos).
 
3. PROBLEMÁTICA IDENTIFICADA
EL FORMHUM000192 si bien recopila información relevante sobre los materiales a destruir no facilita la trazabilidad de la información, haciendo que la búsqueda sea manual. En el proceso de fabricación de medicamentos pueden generarse hasta 500 actas al mes, dificultando el proceso de trazabilidad. También se encuentran formatos que no son diligenciados en su totalidad, lo cual implica procesos de desviaciones; finalmente se menciona que las actas deben estar en físico, por lo tanto, se requiere imprimir, y muchas áreas imprimen a color. 

4. ALCANCE DEL PROYECTO
Incluye
•	Sistematización del proceso de recopilación de destrucción de materiales que actualmente se hace mediante el FORMHUM000192
•	Entrega de PC a áreas que no tienen equipos de cómputo.
No Incluye
•	No aplica

5. ACTORES INVOLUCRADOS
Rol	Función (Qué)
Administrador	Valida, aprueba o rechaza ingresos al sistema
Tiene acceso a todas[LG1.1] las funcionalidades del sistema: Gestión de usuarios- eliminación y/o creación de usuarios, consulta, edición y eliminación de actas, enviar y recibir notificaciones.
Solicitante	Solicita el proceso de destrucción.
Aprobador del área solicitante	Es quien valida o aprueba la solicitud de destrucción desde su área; además define si se requiere aprobación del área de costos.
Área de costos	Revisa, aprueba y/o administra el listado maestro de CECOS activos o inactivos, teniendo en cuenta los tiempos de PT, MP y ME (Para PT, vida útil menor de 1 año. MP y ME 6 meses de uso se aprovisionan. Daños de PT, eventos de calidad-revisar política de inventarios).
Aprobador HSE & S	Revisa, aprueba la destrucción y almacena la destrucción.
Área de Planeación	Administra el listado maestro de registros INVIMA especificando el status de cada registro.

6. REQUERIMIENTOS FUNCIONALES
Código	Descripción
RF-001	Registro de información
RF-002	Ingreso de usuarios
RF-003	Gestión de actividades
RF-004	Creación del acta de destrucción
RF-005	Flujo de aprobación o rechazo
RF-006	Sistema de notificaciones
RF-007	Reportes
RF-008	Maestro de centros de costos
RF-009	Maestro de registros INVIMA

PRECONDICIÓN 001: HSE & S definirá los usuarios genéricos de cada área solicitante y contraseña.

RF-001 Registro de información: De acuerdo con el listado de áreas se requiere registrar la información de los usuarios incluyendo el usuario, contraseña asignada, área solicitante, rol asignado según el numeral anterior y mail corporativo (en caso de ser aprobador). 
El rol de aprobador exigirá ingreso de mail corporativo, para realizar el proceso de notificaciones. 
RF-002 Ingreso de usuarios: Al diligenciar usuario y contraseña el sistema permitirá el ingreso siempre y cuando se tenga la aprobación por el administrador del sistema.
RF-003 Gestión de actividades: el usuario administrador podrá:
-Aprobar o rechazar solicitudes de creación de usuario
-Gestionar los usuarios, crear, modificar y/o eliminar usuarios del sistema
-Eliminar, consultar, editar de actas de destrucción.
RF-004 Creación del acta de destrucción: La funcionalidad de creación de actas, solo estará habilitada para los usuarios solicitantes, previamente aprobados por el área HSE & S.
Al momento de seleccionar un producto, en la creación de un acta estos solo se podrán seleccionar en los estados vigentes. 
Al seleccionar el registro INVIMA el sistema valida: 
1.	Que el producto esté vigente
2.	Si el producto está vigente se diligencian los campos de: nombre de producto, empresa y si es controlado o no controlado, 
El usuario solicitante será responsable de diligenciar la siguiente información OBLIGATORIA:
•	Empresa responsable: Dato recuperado del maestro de registros INVIMA. OJO: QUE TENEMOS LA EMPRESA GENERAL, QUE SE SELECCIONE DE MANERA ÚNICA, PERO QUÉ PASA SI HAY VARIOS INVIMAS DE VARIAS EMPRESAS? LO MISMO QUE EL CECO, DEBE IR POR EMPRESA. DEBEMOS RESPONDER LA DUDA DE SI EL INVIMA ES DE UNA EMPRESA (HUMAX) PERO FUE FARMA EN EL PROCESO DE FABRICACIÓN QUIEN HIZO EL DAÑO, LOS DEBERÍA PAGAR FARMA.
•	Centro de costos del área generadora del residuo.
•	Fecha de solicitud.
•	Descripción del residuo: Dato recuperado del maestro de registros INVIMA (nombre del producto, concentración y presentación para caso de materias primas, productos terminados o materiales de empaque).
•	Código del producto (SAP) para caso de materias primas, productos terminados o materiales de empaque.
•	Número de lote: del producto a destruir; si no tiene detallar como NO APLICA.
•	Orden de producción: En la cual se generó el residuo; si no tiene detallar como NO APLICA.
•	Detallar si el residuo generado es sustancia controlada o no controlado.
•	Clasificación del residuo: DEBEMOS SABER QUÉ TIENE INVIMA Y QUÉ NO
	Materia prima
	 Producto semiterminado
	 Granel 
	Medicamento (producto terminado)
	Productos de devoluciones. 
	Muestras de retención. 
	Remanentes de estabilidad. 
	Reactivos o sustancias químicas. 
	Material de empaque. 
	Otro, especifique cuál esto debería quitarse
•	Fecha de vencimiento del material
•	Causal de destrucción:
	Material o producto vencido (incluye producto terminado, semiterminado, materias primas, material de empaque, muestras de retención y materiales con tiempo de reproceso o almacenamiento vencido). 
	Producto no conforme (incluye incumplimiento de especificaciones de calidad, defectos físicos, visuales, de integridad, rotulado o empaque). 
	Residuos de proceso, control de calidad o desarrollo (incluye controles en proceso, ensayos, análisis, validaciones, arranques de proceso, ajustes de equipos, pruebas y material de desarrollo). 
	Contaminación (incluye contaminación cruzada, microbiológica, química o mezcla con otra sustancia/material). 
	Daño operativo o logístico (incluye fallas de equipos, derrames, daño durante fabricación, manipulación, almacenamiento o transporte). 
	Residuos y remanentes no aprovechables (incluye barridos, sobrantes, remanentes y residuos de fabricación no susceptibles de recuperación o reproceso). 
	Producto retirado o devuelto (incluye retiro de mercado, devoluciones de clientes o producto deteriorado en distribución). 
	Otras causales (especificar).
•	Peso en Kg
•	Número de unidades 
•	Costo de la destrucción en COP
•	Registro sanitario INVIMA
•	Consecutivo de la destrucción: El sistema generará el consecutivo y se pega en la bolsa con cinta o con papel adhesivo. 
•	Registrado por: definir quién está diligenciando el acta de destrucción.
•	Observaciones: Usar este campo para detallar información relevante de la destrucción.
•	Correo corporativo del solicitante.


RF-008 Maestro de centros de costos: Crear en el sistema el listado maestro de centros de costos, permitiendo el control de CeCos activos e inactivos; esta creación tendrá los siguientes datos y la actualización de esta información será responsabilidad del área de finanzas: 
Empresa	Descripción	Ceco	Descrip. CeCo	Área (Denominación)	Responsable	Departamento	Moneda	Status (Activo/Inactivo)

El área de finanzas (costos) administrador podrá modificar o eliminar información del maestro.
RF-009 Maestro de registros INVIMA: Crear en el sistema el listado maestro de registros INVIMA.
Definir cuales campos tendría el maestro:
PRODUCT NAME 	CURRENT REGISTRY NUMBER	INTERNAL STATUS	HOLDER	TIPO DE MEDICAMENTO 

El área de planeación podrá modificar o eliminar información del maestro.

7. REQUERIMIENTOS NO FUNCIONALES
Seguridad
________________________________________
Rendimiento
________________________________________
Disponibilidad
________________________________________
Auditoría
________________________________________
Compatibilidad
________________________________________

8. REGLAS DE NEGOCIO
Código	Regla
RN-001	
RN-002	
RN-003	
RN-004	

Ejemplo:
•	Un usuario no podrá aprobar sus propias solicitudes.
•	Una herramienta solo podrá estar asignada a un colaborador a la vez.




________________________________________
9. FORMULARIOS REQUERIDOS
Formulario N° =
Nombre:
________________________________________
Descripción:
________________________________________Campos
Campo	Tipo de Dato	Obligatorio
		Sí / No
		Sí / No
		Sí / No
Validaciones
________________________________________
________________________________________
10. CONSULTAS Y REPORTES
Nombre del Reporte	Descripción
	
	
	

Formato requerido:
☐ Excel
☐ PDF
☐ Pantalla
☐ Correo Electrónico

11. ROLES Y PERMISOS
Rol	Permisos
Ej: administrador	Eliminar registros
	
	

12. INTEGRACIONES NECESARIAS
Sistema	Descripción
	
	
________________________________________
13. FLUJO DEL PROCESO
Describir paso a paso el funcionamiento esperado.
1.	________________________________________
2.	________________________________________
3.	________________________________________
4.	________________________________________
5.	________________________________________
________________________________________
14. CRITERIOS DE ACEPTACIÓN
La solución será aceptada cuando:
- Cumpla todos los requerimientos funcionales.
- Se validen las reglas de negocio.
- Las pruebas sean satisfactorias.
- Los usuarios aprueben la solución.
Observaciones:
________________________________________
15. RIESGOS IDENTIFICADOS
Riesgo	Impacto	Acción Preventiva
		
		



16. OBSERVACIONES GENERALES
________________________________________

PENDIENTES
Pasos:
3.	Inicio de sesión y registro: Aquí está la solicitud de roles. 
4.	Cómo interactúan los roles: definir en solicitud de creación
5.	Los usuarios estarán asignados a un rol
6.	En el registro se debe dejar usuario genérico y contraseña, mas responsable del área (mail corporativo)
Incluir estado de actas
Incluir usuario por área genérico según Stickers, pero el que diligencia debe firmar el acta
Áreas que requieren PC (7)
Área	Requiere PC?
Dispensado	Si
Manufactura líquidos	Si
Manufactura sólidos	Si
Compresión	Si
Recubrimiento	Si
Envase sólidos	Si
Envase líquidos	Si
Dudas LG:
¿Si el ADD se queda en proceso de diligenciamiento hay estado para borrador?
Cuáles son los estados de las actas: Borrador (¿Hay forma de guardar el borrador?), Creada, enviada, aprobada, rechazada, eliminada, modificada, en espera de aprobación de XXX, cerrada (implica actividades adicionales HSE: registrar fecha de destrucción, gestor, manifiesto de recolección); aquí ya nada podría cambiarse. 
Si no envía porque falten datos, o estén mal diligenciados, ¿muestra errores?
Cada aprobador puede: aprobar, rechazar o solicitar ajuste
Si aprueba sigue el proceso (si es HSE se finaliza). Si se rechaza o pide cambios notifica a los que están en el proceso. Ellos corrigen y vuelven a enviar. 
Desde el solicitante: no puede editar actas después de enviadas, solo cuando le sea devuelta. 
Desde el aprobador: si rechaza describir el por qué, notifica automáticamente a los implicados.
Si el aprobador devuelve para corrección: especificar cuál es la corrección (¿queda historial?) y registrar: 
•	Usuario
•	Fecha
•	Hora
•	Equipo
•	Acción realizada
•	Campo modificado
•	Valor anterior
•	Valor nuevo

Tiempo para que el aprobador responda. ¿Al cuánto tiempo puede el administrador tomar esa tarea?
 
Causal de devolución de ADD	Ejemplo
Información incompleta	Faltan campos obligatorios como lote, peso o costo.
Información inconsistente	No. De lote incompleto (no todos tienen el mismo No. De caracteres -como se identifica), lote es MP y relacionan un PT
Error en la clasificación	Se seleccionó "Materia prima" cuando realmente corresponde a "Material de empaque".
Error en la causal de destrucción	Se eligió una causal que no describe adecuadamente el motivo.
Error en la identificación del producto	Código SAP, nombre del producto o registro INVIMA incorrectos.
Documentación de soporte faltante	Se requiere adjuntar un documento (por ejemplo, una desviación o un reporte de calidad) y no está disponible.
Error en el centro de costos	El centro de costos no corresponde al área solicitante.
Error en el costo	El valor registrado requiere validación o corrección.
Observaciones insuficientes	No se explica claramente la situación cuando la causal lo requiere.
Información ilegible o ambigua	Descripción que no permite identificar claramente el material.
Otro	El aprobador deberá describir el motivo obligatoriamente.



RN-001: Un usuario no puede aprobar una solicitud creada por él mismo.
RN-002: Todo rechazo debe contener observaciones obligatorias.
RN-003: Una acta aprobada no podrá editarse.
RN-004: Una acta destruida no podrá eliminarse.
RN-005: Toda modificación quedará registrada.
RN-006: El consecutivo será único.
RN-007: No podrán existir dos actas con el mismo consecutivo.
RN-008: El sistema almacenará fecha, hora y usuario de cada aprobación.
RN-009: Los correos se enviarán automáticamente.
RN-010: Los campos obligatorios impedirán enviar la solicitud.
RN-011: El sistema mantendrá historial completo.
RN-012: No podrá eliminarse un usuario que tenga actas activas.

Reportes: 
Por fecha
Por producto
Por lote
Por área
Por empresa
Por causal de destrucción
Por tipo de material
Por estado
Por aprobador
Por costo
Por kg
Tiempo de aprobación (del flujo del acta)
Por rechazadas
Por pendientes
Por aprobadas

Búsquedas en el sistema: 
•	Consecutivo
•	Fecha
•	Solicitante
•	Área
•	Empresa
•	Producto
•	Código SAP
•	Lote
•	Orden de producción
•	Registro INVIMA
•	Centro de costos
•	Tipo de material
•	Causal
•	Estado
•	Responsable de aprobación
•	Sustancia controlada (Sí/No)
•	Rango de fechas
•	Rango de costos
•	Rango de peso

Condición	¿Va a Costos?
Producto terminado con vida útil menor a 1 año	Sí
Materia prima con menos de 6 meses de uso	Sí
Material de empaque reutilizable	Sí
Daños por eventos de calidad	Sí
Residuos de proceso sin impacto económico	No
Sustancias químicas de laboratorio	No (o según política)

 
Realizar validaciones de campos si no hay un campo completo no puede continuar, el botón de notificaciones permita ver las notificaciones y q al darle click permita ver el resumen de lo que sea la notificación, que se envíen correos, que permita enviar para revisar el flujo de aprobación en todas las áreas que deben aprobar, maestro de cecos es el siguiente:








Empresa	Ceco	Denominación	Responsable	Departamento	CeCo	Mon.	Status	Empresa
CO11	1001	DIRECCION DE OPERAC	Desiree Torres	DIREC OPER	F - Production	COP	Activo	Humax
CO11	1002	GERENCIA DE PRODUCCI	DIANA GIL	PRODUCCION	F - Production	COP	Activo	Humax
CO11	1006	HC HUMAX	Michel Revelo	FINANZAS	F - Production	COP	Activo	Humax
CO11	1007	Metros cuadrados	Michel Revelo	FINANZAS	F - Production	COP	Activo	Humax
CO11	1008	DISTRIBUCION CELULAR	Ferney Estrada	FINANZAS	F - Production	COP	Activo	Humax
CO11	1009	HC PERSONAL DE VENTA	Michel Revelo	FINANZAS	F - Production	COP	Activo	Humax
CO11	1010	HC PERSONAL 100%	Michel Revelo	FINANZAS	F - Production	COP	Activo	Humax
CO11	1012	HC HUMAX GH	GUILLERMO CAICEDO	G&A	W - Administration	COP	Activo	Humax
CO11	1013	MT2 HUMAX MMTO	CAMILO FERRO	OPERACIONES	F - Production	COP	Activo	Humax
CO11	1015	HC HUMAX MTTO	CAMILO FERRO	Operaciones	F - Production	COP	Activo	Humax
CO11	1016	MT2 HUMAX HSE	Hernan Garces	Operaciones	F - Production	COP	Activo	Humax
CO11	1017	HC HUMAX HSE	Hernan Garces	Operaciones	F - Production	COP	Activo	Humax
CO11	1101	VIALES-SOL INYECTABL	DIANA GIL	PRODUCCION	F - Production	COP	Activo	Humax
CO11	1103	AMPOLLETAS-SOL INYEC	DIANA GIL	PRODUCCION	F - Production	COP	Activo	Humax
CO11	1104	SOLUCIONES ORALES	DIANA GIL	PRODUCCION	F - Production	COP	Activo	Humax
CO11	1105	SOLUCIONES OFTALMICA	DIANA GIL	PRODUCCION	F - Production	COP	Activo	Humax
CO11	1106	SEMISOLIDOS	DIANA GIL	PRODUCCION	F - Production	COP	Activo	Humax
CO11	1107	DISPENSADO	DIANA GIL	PRODUCCION	F - Production	COP	Activo	Humax
CO11	1109	ACONDICIONADO	DIANA GIL	PRODUCCION	F - Production	COP	Activo	Humax
CO11	1111	OTROS SOLIDOS	DIANA GIL	OPERACIONES	F - Production	COP	Activo	Humax
CO11	1112	Cremas	DIANA GIL	OPERACIONES	F - Production	COP	Activo	Humax
CO11	1113	Liquidos	DIANA GIL	OPERACIONES	F - Production	COP	Activo	Humax
CO11	1116	Envases- Solidos	Diana Gil	Producción	F - Production	COP	Activo	Humax
CO11	1117	Envases- Liquidos	Diana Gil	Producción	F - Production	COP	Activo	Humax
CO11	1900	SUBABSORCIÓN	Michel Revelo	OPERACIONES	F - Production	COP	Activo	Humax
CO11	2060	COMPRAS	Carlos Aguirre	COMPRAS	W - Administration	COP	Activo	Humax
CO11	2100	ALMCN MATERIALES	Diego Lopez	ALMACEN	W - Administration	COP	Activo	Humax
CO11	2200	MANTENIMIENTO	CAMILO FERRO	PRODUCCION	W - Administration	COP	Activo	Humax
CO11	2300	FACILITIES	Jhon Bolaños	OPERACIONES	F - Production	COP	Activo	Humax
CO11	2401	Ing. y Proyectos	CAMILO FERRO	Operaciones	F - Production	COP	Activo	Humax
CO11	2600	GERENCIA PLANEACIÓN	Andres Gutierrez	PLANEACION P	W - Administration	COP	Activo	Humax
CO11	3001	GCIA CTROL D CALIDAD	Andrea Gaviria	CONTROL CALI	F - Production	COP	Activo	Humax
CO11	3002	GCIA ASEG D CALIDAD	Andrea Gaviria	ASEG CALIDAD	F - Production	COP	Activo	Humax
CO11	3005	Dpto costos	Michel Revelo	FINANZAS	F - Production	COP	Activo	Humax
CO11	3008	Seguridad y salud oc	Hernan Garces	SSG	F - Production	COP	Activo	Humax
CO11	3010	MOB	Carol Veloza	Inv. y Dllo	F - Production	COP	Activo	Humax
CO11	3012	Servicios de fabrica	Desiree Torres	OPERACIONES	F - Production	COP	Activo	Humax
CO11	3013	Validaciones y DT	Carol Veloza	OPERACIONES	F - Production	COP	Activo	Humax
CO11	3014	Integrated Business	Corporativo	 Operaciones	F - Production	COP	Activo	Humax
CO11	3101	CONTROL FISIC QUIMIC	ANDREA GAVIRIA	CONTROL CALI	F - Production	COP	Activo	Humax
CO11	3102	CTROL MICROBIOLOGICO	ANDREA GAVIRIA	CONTROL CALI	F - Production	COP	Activo	Humax
CO11	4003	BUM	PEDRO PABLO MARTINEZ	SF-ADMIN	V - Sales	COP	Activo	Humax
CO11	4007	Entrenamiento	PEDRO PABLO MARTINEZ	SELLING	W - Administration	COP	Activo	Humax
CO11	4011	DIRECCION GENERAL	Luis Mendez	FINANZAS	W - Administration	COP	Activo	Humax
CO11	4020	ADMON FUERZA D VTAS	Pedro Martinez	VENTAS	W - Administration	COP	Activo	Humax
CO11	4057	GCIA DE DISTRITO INS	Pedro Martinez	VENTAS	W - Administration	COP	Activo	Humax
CO11	4058	KAM COMERCIAL	Pedro Martinez	VENTAS	W - Administration	COP	Activo	Humax
CO11	4059	GTE DE DISTRITO OCC	Pedro Martinez	VENTAS	W - Administration	COP	Activo	Humax
CO11	4060	GCIA DE PROM COMERCI	Maria Vianney Trujil	VENTAS	W - Administration	COP	Activo	Humax
CO11	4064	GCIA NAC DE VENTAS	Pedro Martinez	Ventas	V - Sales	COP	Activo	Humax
CO11	4065	Gcia Distrit Costa N	Pedro Martinez	SELLING	W - Administration	COP	Activo	Humax
CO11	4066	GERENCIA TRADE MARKE	Pedro Martinez	SELLING	W - Administration	COP	Activo	Humax
CO11	4067	GCIA DE PROMO INST	Pedro Martinez	SELLING	W - Administration	COP	Activo	Humax
CO11	4068	GTE DE DISTRITO ORIE	Pedro Martinez	SELLING	W - Administration	COP	Activo	Humax
CO11	4069	Gcia Distrito Centro	Pedro Martinez	SELLING	W - Administration	COP	Activo	Humax
CO11	4070	KAM INSTITUCIONAL	Pedro Martinez	Selling	W - Administration	COP	Activo	Humax
CO11	4071	Entrenamiento	Pedro Martinez	SELLING	W - Administration	COP	Activo	Humax
CO11	4072	GERENCIA DE ACCESO	Pedro Martinez	COMERCIAL	V - Sales	COP	Activo	Humax
CO11	4073	Gerencia Des Negocio	LMENDEZ	VENTAS	V - Sales	COP	Activo	Humax
CO11	4401	Farmacovigilacia	Cesar Pedrajo	Farmacovigil	W - Administration	COP	Activo	Humax
CO11	4500	MARKETING COMERCIAL	Pedro Martinez	Marketing	W - Administration	COP	Activo	Humax
CO11	4502	MARKETING DIGITAL	Pedro Martinez	A&P	W - Administration	COP	Activo	Humax
CO11	4503	SOLTA	ERICA HENAO	A&P	W - Administration	COP	Activo	Humax
CO11	4552	Gerencia de Producto	FERNANDO ARIZA	A&P	W - Administration	COP	Activo	Humax
CO11	4553	Gerencia de Mercadeo	FERNANDO ARIZA	A&P	W - Administration	COP	Activo	Humax
CO11	4556	MARKETING INSTITUCIO	Erica Henao	MARKETING	V - Sales	COP	Activo	Humax
CO11	4700	GCIA ALMACENES Y DIS	Diego Lopez	Logistics	W - Administration	COP	Activo	Humax
CO11	4702	GCIA ALMACENES Y DIS	Diego Lopez	Logistics	W - Administration	COP	Activo	Humax
CO11	4703	Centro distribución	Diego Lopez	Logistics	W - Administration	COP	Activo	Humax
CO11	4716	Gerencia QA	Andrea Gaviria	QA	G - Logistics	COP	Activo	Humax
CO11	5000	Medica	Sebastián González	Dir. Medica	E - Development	COP	Activo	Humax
CO11	5100	Regulatorio	Luz Garcia	AsuntRegulat	E - Development	COP	Activo	Humax
CO11	5101	Asuntos Regul SOLTA	Ana Maria Gallego	AsuntRegulat	E - Development	COP	Activo	Humax
CO11	5400	 FVig Corporativo	Vannesa Cuervo	Farmacovigil	E - Development	COP	Activo	Humax
CO11	5600	R&D Projects	Heidy Martinez	R&D	E - Development	COP	Activo	Humax
CO11	5800	Geo Expansión	Carol Veloza	R&D	E - Development	COP	Activo	Humax
CO11	6214	FINANZAS	Carmenza Pardo	FINANZAS	W - Administration	COP	Activo	Humax
CO11	6261	Executive&Admin_B	Bladimir Lozada	Business Dev	W - Administration	COP	Activo	Humax
CO11	6290	GERENCIA DE IT	FERNEY ESTRADA	IT	W - Administration	COP	Activo	Humax
CO11	6310	Compliance Officer	Pedro Martinez	LEGAL	W - Administration	COP	Activo	Humax
CO11	6311	GERENCIA DE LEGAL	Pedro Martinez	LEGAL	W - Administration	COP	Activo	Humax
CO11	6350	SEG. PATRIMONIAL	Mauricio Rojas	Finanzas	W - Administration	COP	Activo	Humax
CO11	6351	GESTIÓN DOCUMENTAL	John Bolaños	G&A	W - Administration	COP	Activo	Humax
CO11	6370	GERENCIA DE RECURSOS	Guillermo Caicedo	HR	W - Administration	COP	Activo	Humax
CO13	1001	DIRECCION DE OPERAC	Desiree Torres	DIREC OPER	F - Production	COP	Activo	Cambridge
CO13	1002	GERENCIA DE PRODUCCI	Diana Gil	PRODUCCION	F - Production	COP	Activo	Cambridge
CO13	1006	HC Cambridge	Michel Revelo	FINANZAS	F - Production	COP	Activo	Cambridge
CO13	1008	DISTRIBUCION CELULAR	Michel Revelo	FINANZAS	F - Production	COP	Activo	Cambridge
CO13	1009	HC PERSONAL DE VENTA	Michel Revelo	FINANZAS	F - Production	COP	Activo	Cambridge
CO13	1010	HC PERSONAL 100%	Michel Revelo	FINANZAS	F - Production	COP	Activo	Cambridge
CO13	1101	VIALES - SOLUCION IN	Diana Gil	PRODUCCION	F - Production	COP	Activo	Cambridge
CO13	1103	AMPOLLETAS-SOL INYEC	Diana Gil	PRODUCCION	F - Production	COP	Activo	Cambridge
CO13	1104	SOLUCIONES ORALES -	Diana Gil	PRODUCCION	F - Production	COP	Activo	Cambridge
CO13	1107	DISPENSADO	Diana Gil	PRODUCCION	F - Production	COP	Activo	Cambridge
CO13	1115	AMPOLLAS	Diana Gil	PRODUCCION	F - Production	COP	Activo	Cambridge
CO13	1900	SISTEMA DE AGUA	Michel Revelo	FINANZAS	F - Production	COP	Activo	Cambridge
CO13	2060	COMPRAS	Carlos Aguirre	COMPRAS	W - Administration	COP	Activo	Cambridge
CO13	2100	ALMCN MATERIALES	Diego Lopez	ALMACEN	W - Administration	COP	Activo	Cambridge
CO13	2200	MANTENIMIENTO	CAMILO FERRO	PRODUCCION	W - Administration	COP	Activo	Cambridge
CO13	2401	Ing. y Proyectos	CAMILO FERRO	Operaciones	F - Production	COP	Activo	Cambridge
CO13	2600	GERENCIA PLANEACIÓN	Andres Gutierrez	PLANEACION P	W - Administration	COP	Activo	Cambridge
CO13	3001	GERENCIA DE CONTROL	Andrea Gaviria	CONTROL CALI	F - Production	COP	Activo	Cambridge
CO13	3002	GERENCIA DE ASEGURAM	Andrea Gaviria	ASEG CALIDAD	F - Production	COP	Activo	Cambridge
CO13	3005	Dpto costos	Michel Revelo	FINANZAS	F - Production	COP	Activo	Cambridge
CO13	3008	Seguridad y salud oc	Hernan Garces	SSG	F - Production	COP	Activo	Cambridge
CO13	3010	MOB	Carol Veloza	Inv. y Dllo	F - Production	COP	Activo	Cambridge
CO13	3013	Validaciones y DT	Carol Veloza	OPERACIONES	F - Production	COP	Activo	Cambridge
CO13	3101	CONTROL FISIC QUIMIC	Andrea Gaviria	CONTROL CALI	F - Production	COP	Activo	Cambridge
CO13	3102	CTROL MICROBIOLOGICO	Andrea Gaviria	CONTROL CALI	F - Production	COP	Activo	Cambridge
CO13	4011	DIRECCION GENERAL	Luis Mendez	FINANZAS	W - Administration	COP	Activo	Cambridge
CO13	4500	ESTRAT E INTEL MERC	Erica Henao	Marketing	W - Administration	COP	Activo	Cambridge
CO13	4502	GERENCIA DE MERCADOT	Erica Henao	MERCADEO	W - Administration	COP	Activo	Cambridge
CO13	4700	GERENCIA ALMACENES Y	Diego Lopez	Logistics	W - Administration	COP	Activo	Cambridge
CO13	4702	GCIA ALMACENES Y DIS	Diego Lopez	Logistics	W - Administration	COP	Activo	Cambridge
CO13	4716	Gerencia QA	Andrea Gaviria	QA	G - Logistics	COP	Activo	Cambridge
CO13	5100	Regulatorio	Luz Garcia	AsuntRegulat	E - Development	COP	Activo	Cambridge
CO13	5600	R&D Projects	Heidi Martinez	R&D	E - Development	COP	Activo	Cambridge
CO13	6214	FINANZAS	Carmenza Pardo	FINANZAS	W - Administration	COP	Activo	Cambridge
CO13	6290	GERENCIA DE IT	Ferney Estrada	IT	W - Administration	COP	Activo	Cambridge
CO13	6311	GERENCIA DE LEGAL	Pedro Martinez	FINANZAS	W - Administration	COP	Activo	Cambridge
CO13	6350	SEG. PATRIMONIAL	Mauricio Rojas	Finanzas	W - Administration	COP	Activo	Cambridge
CO13	6370	GERENCIA DE RECURSOS	Guillermo Caicedo	HR	W - Administration	COP	Activo	Cambridge
CO12	1001	DIRECCION DE OPERAC	Desiree Torres	DIREC OPER	F - Production	COP	Activo	Farmatech
CO12	1002	GERENCIA DE PRODUCCI	Diana Gil	PRODUCCION	F - Production	COP	Activo	Farmatech
CO12	1006	HC Pharmatech	Michel Revelo	FINANZAS	F - Production	COP	Activo	Farmatech
CO12	1007	Metros cuadrados	Michel Revelo	FINANZAS	F - Production	COP	Activo	Farmatech
CO12	1008	DISTRIBUCION CELULAR	Ferney Estrada	FINANZAS	F - Production	COP	Activo	Farmatech
CO12	1009	HC PERSONAL DE VENTA	Michel Revelo	FINANZAS	F - Production	COP	Activo	Farmatech
CO12	1010	HC PERSONAL 100%	Michel Revelo	FINANZAS	F - Production	COP	Activo	Farmatech
CO12	1011	M2 Farma la Estrell	YAMILE ROJO	FINANZAS	F - Production	COP	Activo	Farmatech
CO12	1012	HC FARMATECH GH	Guillermo Caicedo	G&A	W - Administration	COP	Activo	Farmatech
CO12	1013	MT2 FARMA CENT MMTO	CAMILO FERRO	Operaciones	F - Production	COP	Activo	Farmatech
CO12	1014	MT2 FARMATECH MTTO	CAMILO FERRO	Operaciones	F - Production	COP	Activo	Farmatech
CO12	1015	HC FARMATECH MTTO	CAMILO FERRO	Operaciones	F - Production	COP	Activo	Farmatech
CO12	1016	MT2 FARMATECH HSE	Hernan Garces	Operaciones	F - Production	COP	Activo	Farmatech
CO12	1017	HC FARMATECH HSE	Hernan Garces	Operaciones	F - Production	COP	Activo	Farmatech
CO12	1103	AMPOLLETAS-SOL INYEC	Diana Gil	PRODUCCION	F - Production	COP	Activo	Farmatech
CO12	1107	DISPENSADO	Diana Gil	PRODUCCION	F - Production	COP	Activo	Farmatech
CO12	1109	ACONDICIONADO	Diana Gil	PRODUCCION	F - Production	COP	Activo	Farmatech
CO12	1111	OTROS SOLIDOS	Diana Gil	PRODUCCION	F - Production	COP	Activo	Farmatech
CO12	1112	Cremas	Diana Gil	Manufacturin	F - Production	COP	Activo	Farmatech
CO12	1113	LIQUIDOS	Diana Gil	Manufacturin	F - Production	COP	Activo	Farmatech
CO12	1114	COSMETICOS	Diana Gil	Manufacturin	F - Production	COP	Activo	Farmatech
CO12	1116	Envases- Solidos	Diana Gil	Producción	F - Production	COP	Activo	Farmatech
CO12	1117	Envases- Liquidos	Diana Gil	Producción	F - Production	COP	Activo	Farmatech
CO12	1900	SUBABSORCIÓN	Michel Revelo	OPERACIONES	F - Production	COP	Activo	Farmatech
CO12	2060	COMPRAS	Carlos Aguirre	COMPRAS	W - Administration	COP	Activo	Farmatech
CO12	2100	ALMACEN DE MATERIALE	Diego Lopez	ALMACEN	W - Administration	COP	Activo	Farmatech
CO12	2200	MANTENIMIENTO	CAMILO FERRO	PRODUCCION	W - Administration	COP	Activo	Farmatech
CO12	2300	FACILITIES	Jhon Bolaños	OPERACIONES	F - Production	COP	Activo	Farmatech
CO12	2401	Ing. y Proyectos	CAMILO FERRO	Operaciones	F - Production	COP	Activo	Farmatech
CO12	2600	GERENCIA PLANEACIÓN	Andres Gutierrez	PLANEACION P	W - Administration	COP	Activo	Farmatech
CO12	3001	GERENCIA DE CONTROL	Andrea Gaviria	CONTROL CALI	F - Production	COP	Activo	Farmatech
CO12	3002	GERENCIA DE ASEGURAM	Andrea Gaviria	ASEG CALIDAD	F - Production	COP	Activo	Farmatech
CO12	3005	Dpto costos	Michel Revelo	FINANZAS	F - Production	COP	Activo	Farmatech
CO12	3008	Seguridad y salud oc	Hernan Garces	SSG	F - Production	COP	Activo	Farmatech
CO12	3010	MOB	Carol Veloza	Inv. y Dllo	F - Production	COP	Activo	Farmatech
CO12	3012	Servicios de fabrica	Desiree Torres	OPERACIONES	F - Production	COP	Activo	Farmatech
CO12	3013	Validaciones y DT	Carol Veloza	OPERACIONES	F - Production	COP	Activo	Farmatech
CO12	3014	Integrated Business	Corporativo	Operaciones	F - Production	COP	Activo	Farmatech
CO12	3015	VALIDACIÓN SIST CALI	Carmenza Pardo	FINANZAS	W - Administration	COP	Activo	Farmatech
CO12	3016	Transferencia Tecno	Susana Anguiano	Inv y Drroll	E - Development	COP	Activo	Farmatech
CO12	3101	CONTROL FISIC QUIMIC	Andrea Gaviria	CONTROL CALI	F - Production	COP	Activo	Farmatech
CO12	3102	CTROL MICROBIOLOGICO	Andrea Gaviria	CONTROL CALI	F - Production	COP	Activo	Farmatech
CO12	4001	DIR CAC Y EXPORTACIO	Diego Lopez	EXPORT	W - Administration	COP	Activo	Farmatech
CO12	4011	DIRECCION GENERAL	Luis Mendez	FINANZAS	W - Administration	COP	Activo	Farmatech
CO12	4020	ADMINISTRACION FUERZ	Pablo Martinez	SF - Admin	W - Administration	COP	Activo	Farmatech
CO12	4270	REGIONAL BOGOTA	Pablo Martinez	FUERZA VTAS	V - Sales	COP	Activo	Farmatech
CO12	4271	REGIONAL MEDELLIN	Pablo Martinez	FUERZA VTAS	V - Sales	COP	Activo	Farmatech
CO12	4272	REGIONAL CALI	Pablo Martinez	FUERZA VTAS	V - Sales	COP	Activo	Farmatech
CO12	4273	REGIONAL PEREIRA	Pablo Martinez	FUERZA VTAS	V - Sales	COP	Activo	Farmatech
CO12	4274	REGIONAL BUCARAMANGA	Pablo Martinez	FUERZA VTAS	V - Sales	COP	Activo	Farmatech
CO12	4275	REGIONAL BARRANQUILL	Pablo Martinez	FUERZA VTAS	V - Sales	COP	Activo	Farmatech
CO12	4500	ESTRAT E INTEL MERC	Pedro Martinez	Marketing	W - Administration	COP	Activo	Farmatech
CO12	4502	GERENCIA DE MERCADOT	Erica Henao	MERCADEO	W - Administration	COP	Activo	Farmatech
CO12	4700	GERENCIA ALMACENES Y	Diego Lopez	Logistics	W - Administration	COP	Activo	Farmatech
CO12	4702	GCIA ALMACENES Y DIS	Diego Lopez	Logistics	W - Administration	COP	Activo	Farmatech
CO12	4703	Centro distribución	Diego Lopez	Logistics	W - Administration	COP	Activo	Farmatech
CO12	4716	Gerencia QA	Andrea Gaviria	QA	G - Logistics	COP	Activo	Farmatech
CO12	5100	Regulatorio	Luz Garcia	AsuntRegulat	E - Development	COP	Activo	Farmatech
CO12	5600	R&D Projects	Heidi Martinez	R&D	E - Development	COP	Activo	Farmatech
CO12	6214	FINANZAS	Carmenza Pardo	FINANZAS	W - Administration	COP	Activo	Farmatech
CO12	6290	GERENCIA DE IT	Ferney Estrada	IT	W - Administration	COP	Activo	Farmatech
CO12	6310	Compliance Officer	Pedro Martinez	LEGAL	W - Administration	COP	Activo	Farmatech
CO12	6311	GERENCIA DE LEGAL	Pedro Martinez	FINANZAS	W - Administration	COP	Activo	Farmatech
CO12	6350	SEG. PATRIMONIAL	Mauricio Rojas	Finanzas	W - Administration	COP	Activo	Farmatech
CO12	6351	GESTIÓN DOCUMENTAL	Jhon Bolaños	G&A	W - Administration	COP	Activo	Farmatech
CO12	6370	GERENCIA DE RECURSOS	Guillermo Caicedo	HR	W - Administration	COP	Activo	Farmatech



