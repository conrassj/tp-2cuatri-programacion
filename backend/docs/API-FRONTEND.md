# API para el frontend

La documentación interactiva está en `/docs`. La colección `postman/Clinica-Frontend-Final.postman_collection.json` incluye todos los endpoints.

Todas las respuestas tienen `{ codigo, estado, datos }`. Éxito: `estado: "ok"`. Error: `estado` contiene el mensaje para mostrar. Fechas: `YYYY-MM-DD`; horas: `HH:MM`.

Errores: 400 datos inválidos; 401 sin token o vencido; 403 sin permiso; 404 no encontrado; 409 duplicado, dependencia o conflicto; 500 fallo inesperado.

## Endpoints

| Método | Ruta | Roles | Para qué sirve |
| --- | --- | --- | --- |
| GET | `/health` | público | Verifica servidor y conexión con MySQL. |
| POST | `/auth/registro` | público | Crea solo pacientes. DNI y email únicos. Contraseña de 6 caracteres a 72 bytes. Fecha de nacimiento real y no futura. |
| POST | `/auth/login` | público | Devuelve token y usuario sin contraseña. |
| GET | `/auth/perfil` | todos | Obtiene el usuario del token, sin contraseña. |
| GET | `/coberturas/disponibles` | público | Coberturas públicas para el formulario de registro. |
| GET | `/sedes` | todos | Lista de registros; sedes y especialidades disponibles para todo usuario autenticado. |
| POST | `/sedes` | admin | Alta. Registra auditoría. |
| PUT | `/sedes/{id}` | admin | Modificación. Registra auditoría. |
| DELETE | `/sedes/{id}` | admin | Baja física solo si no hay dependencias. Si está en uso devuelve 409 y conserva el registro. |
| GET | `/especialidades` | todos | Lista de registros; sedes y especialidades disponibles para todo usuario autenticado. |
| POST | `/especialidades` | admin | Alta. Registra auditoría. |
| PUT | `/especialidades/{id}` | admin | Modificación. Registra auditoría. |
| DELETE | `/especialidades/{id}` | admin | Baja física solo si no hay dependencias. Si está en uso devuelve 409 y conserva el registro. |
| GET | `/coberturas` | admin | Lista de registros; sedes y especialidades disponibles para todo usuario autenticado. |
| POST | `/coberturas` | admin | Alta. Registra auditoría. |
| PUT | `/coberturas/{id}` | admin | Modificación. Registra auditoría. |
| DELETE | `/coberturas/{id}` | admin | Baja física solo si no hay dependencias. Si está en uso devuelve 409 y conserva el registro. |
| GET | `/usuarios` | admin | Listado paginado de 10 registros. Respuesta datos: {items,total}. Incluye ids de especialidades de cada médico. |
| POST | `/usuarios` | admin | Alta de operador, médico o admin. Médico y operador requieren sede; médico requiere especialidades. Admin sin sede. Alta de pacientes por registro o recepción. |
| PUT | `/usuarios/{id}` | admin | Edita todos los datos de un usuario conservando su rol. Incluye pacientes. Contraseña vacía conserva la actual. No permite quitar una especialidad con agenda. |
| GET | `/pacientes` | admin, medico, operador | Busca por DNI o apellido. Mínimo 2 caracteres; hasta 30 coincidencias. No devuelve contraseña. |
| POST | `/pacientes` | operador | Registra un paciente con las mismas validaciones del registro público. Audita al operador. |
| PUT | `/pacientes/perfil` | paciente | Solo admite email, teléfono, cobertura y contraseña opcional; rechaza otras propiedades. El id sale del token. |
| GET | `/medicos` | todos | Devuelve id, nombre, apellido y especialidades; no expone otros datos personales. La sede se filtra por agendas del médico. |
| GET | `/disponibilidad` | paciente, operador | Requiere médico, sede y especialidad. Sin fecha devuelve fechas con horarios libres futuros; con fecha también devuelve horarios. Turnos de 30 minutos. Datos: {fechas,horarios:[{fecha,hora,id_agenda}],duracion}. |
| GET | `/agendas` | admin, medico, operador | Lista con médico, sede, especialidad y turnos_confirmados. Médico solo su agenda; operador puede consultar otras sedes. |
| POST | `/agendas` | admin, medico, operador | Rangos sin superposición; especialidad asignada al médico. Médico solo su agenda; operador solo su sede. |
| PUT | `/agendas/{id}` | admin, medico, operador | Mismos permisos. No puede reasignar el médico ni dejar turnos confirmados/atendidos fuera del rango o alterar su fecha/sede/especialidad. |
| DELETE | `/agendas/{id}` | admin, medico, operador | Mismos permisos. No borra agendas con turnos asociados, para conservar el historial; devuelve 409. |
| POST | `/turnos` | paciente, operador | Paciente para sí mismo; operador envía id_paciente y solo reserva en su sede. Cobertura tomada de la base. Conflicto de horario: 409. Alta y notificaciones en una transacción. |
| GET | `/turnos/mios` | paciente | Turnos propios con nombres e historial. Próximos primero, después pasados del más reciente al más antiguo. |
| GET | `/turnos/medico` | medico | Turnos propios de la fecha en todas las sedes. Incluye paciente, fecha_nacimiento, nota y resumen clínico. |
| GET | `/turnos/sede` | operador | Turnos de su sede en la fecha solicitada. La sede sale del perfil actual del token. |
| PATCH | `/turnos/{id}/cancelar` | paciente, operador, medico | Solo confirmado. Paciente: propio; operador: su sede; médico: propio en cualquier sede. Notifica paciente y médico. |
| PATCH | `/turnos/{id}/atender` | medico | Solo turno propio confirmado, en cualquier sede. Con diagnóstico guarda atención e historial juntos. Sin body conserva compatibilidad con atención y posterior carga de historial. |
| POST | `/historial/{idTurno}` | medico | Carga historial de un turno propio ya atendido sin historial previo. Diagnóstico obligatorio, campos de hasta 255 caracteres. |
| GET | `/historial/mio` | paciente | Historial completo del paciente autenticado. |
| GET | `/historial/paciente/{idPaciente}` | medico | Solo registros de ese paciente atendidos por el médico autenticado. |
| GET | `/notificaciones` | todos | Notificaciones propias, más recientes primero. |
| PATCH | `/notificaciones/{id}/leida` | todos | Marca una notificación propia como leída. Una ajena devuelve 404. |
| GET | `/auditoria` | admin | Registro de acciones con nombre del usuario, entidad, detalle y fecha. Más recientes primero; la interfaz lo pagina. |
| GET | `/reportes/turnos-por-especialidad` | admin | Respuesta datos: [{id,nombre,cantidad}]. Fechas inclusivas; sin filtros usa todo el histórico. |
| GET | `/reportes/turnos-por-sede` | admin | Respuesta datos: [{id,nombre,cantidad}]. Fechas inclusivas; sin filtros usa todo el histórico. |
| GET | `/reportes/ranking-medicos` | admin | Respuesta datos: [{id_medico,medico,atendidos}]. Fechas inclusivas; sin filtros usa todo el histórico. |
| GET | `/reportes/tasa-cancelacion` | admin | Respuesta datos: {total,cancelados,tasa}; tasa de 0 a 1. Fechas inclusivas; sin filtros usa todo el histórico. |

## Ejemplos

### Reserva de un turno

```json
{
  "id_medico": 3,
  "id_especialidad": 1,
  "id_sede": 1,
  "fecha": "{{fecha}}",
  "hora": "10:30",
  "nota": "Consulta de control"
}
```
Reemplazar `{{fecha}}` por una fecha real con disponibilidad. El operador agrega `id_paciente`. No se recibe `id_cobertura`.

### Atención con historial

```json
{
  "diagnostico": "Control de prueba",
  "tratamiento": "Indicaciones de prueba",
  "observaciones": "Registro ficticio"
}
```
Se envía a `PATCH /turnos/:id/atender`. Estado, historial y notificaciones se guardan juntos.

## Cambios respecto del backend anterior

- Lectura de sedes y especialidades habilitada a usuarios autenticados. Escritura solo admin.
- Médico puede operar sobre sus turnos en varias sedes.
- Operador solo modifica agenda y turnos de su sede.
- Se agregaron usuarios, pacientes, médicos y disponibilidad.
- Listados de turnos incluyen nombres, fecha de nacimiento e historial.
- Agenda protege los turnos existentes y valida especialidades asignadas.
- Usuarios y sus cambios se auditan con el middleware existente.
- La creación de la base usa ids INT e índices únicos para evitar límites y duplicados.
- Las colecciones de semanas anteriores se conservan como referencia; algunos casos esperados cambiaron con la consigna final. Usar la colección Final para esta entrega.