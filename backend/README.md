# Backend — Clínica virtual

API del proyecto final de Programación 2. Se tomó como base el repositorio `nachorequena/tp-integrador-programacion` y se agregaron los ajustes necesarios para el frontend final. El README anterior se conserva en `docs/README-original.md`.

## Tecnologías usadas

- Node.js 24.15.0.
- Express 5, TypeScript 7 y mysql2, conservando las dependencias del backend recibido.
- JWT para la sesión y bcrypt para las contraseñas.
- MySQL o MariaDB. Verificado con MariaDB 10.4.32 de XAMPP.

Las versiones exactas están en `package-lock.json`. Usar `npm ci` para repetir la instalación o `npm install` como pide la consigna.

## Instalación desde cero

1. Encender MySQL/MariaDB.
2. Abrir una terminal en esta carpeta y ejecutar `npm install`.
3. Copiar `.env.example` a `.env` y completar los valores. En PowerShell: `Copy-Item .env.example .env`.
4. Elegir una **base vacía**, por ejemplo `clinica_final`, en `DB_NAME`.
5. Ejecutar:

```bash
npm run db:crear
npm run db:demo
npm run dev
```

`db:crear` crea la base si falta e importa el esquema de la cátedra. Si encuentra tablas, corta sin borrarlas. El usuario de MySQL debe poder crear bases y tablas; si no puede crear bases, crear una base vacía desde phpMyAdmin y usar ese nombre.

El script mantiene las tablas y relaciones originales, pero usa `INT` en lugar de `tinyint` para no quedarse sin ids al llegar a 127 registros. Agrega índices únicos a DNI, email e historial por turno. El SQL original de la cátedra se conserva sin modificar.

`db:demo` carga tres médicos con distintas especialidades, un médico en dos sedes, agendas para los días actuales y turnos en los tres estados. Se puede volver a ejecutar para agregar fechas actuales; conserva los registros y restablece las contraseñas de las cuentas de demostración. **No usar este seed sobre una base real.**

Si ya tienen una base del trabajo anterior, conserven una copia y usen otra base vacía para esta entrega. Estos scripts no migran automáticamente una base existente.

La API escucha en `http://localhost:3000`. Comprobar:

- `GET /health`: verifica también la conexión a la base.
- `GET /docs`: documentación Swagger de los endpoints finales.

Después levantar el frontend desde su propia carpeta con `npm install` y `npm start`.

## Variables de entorno

| Variable | Ejemplo | Uso |
| --- | --- | --- |
| PORT | 3000 | Puerto HTTP de la API |
| DB_HOST | 127.0.0.1 | Dirección del motor MySQL |
| DB_PORT | 3306 | Puerto de MySQL |
| DB_USER | root | Usuario de la base |
| DB_PASSWORD | vacío en algunas instalaciones de XAMPP | Contraseña de la base |
| DB_NAME | clinica_final | Base de esta entrega |
| JWT_SECRET | un valor largo propio | Firma de tokens |
| JWT_EXPIRES_IN | 2h | Duración de sesión |
| CORS_ORIGEN | http://localhost:4200 | Origen permitido del frontend |

`.env` es local y no se sube. En la computadora donde se preparó la entrega se usó una base aislada en **3307**, y ese valor ya está en el `.env` local. En otra computadora usar el puerto de su instalación, normalmente 3306.

## Usuarios de prueba

| Nombre | Rol | DNI | Contraseña |
| --- | --- | --- | --- |
| Marcos Gomez | admin | 18222333 | admin123 |
| Juan Perez | operador, sede Centro | 15200548 | operador123 |
| Ana Lopez | medico, Centro y Norte | 20111222 | medico123 |
| Carlos Ruiz | medico, Norte | 25333444 | medico123 |
| Lucía Fernandez | medico, Centro | 27444555 | medico123 |
| Franco Friggeri | paciente | 36000960 | paciente123 |

Son datos ficticios para demostrar el sistema. Los registros de prueba incluyen una atención marcada como atendida en una agenda próxima para poder mostrar todos los estados sin esperar a otro día.

## Organización

- `routes`: URL y roles permitidos.
- `controllers`: validan la petición, llaman al service y devuelven la respuesta.
- `services`: reglas y consultas SQL.
- `validators`: formato, campos obligatorios y límites.
- `middlewares`: token, roles, auditoría y errores.
- `scripts`: preparación de la base, datos demo y pruebas.
- `postman`: colecciones de las entregas anteriores y colección final.

## Respuesta uniforme

```json
{ "codigo": 200, "estado": "ok", "datos": {} }
```

En un error, `estado` contiene el mensaje y `datos` es `null`. Se usan 400 para datos inválidos, 401 para sesión, 403 para permisos, 404 para no encontrado y 409 para conflictos o dependencias. Los errores inesperados se registran en el servidor y devuelven un mensaje general.

## Ajustes para el front

- Sedes y especialidades se pueden consultar con cualquier sesión. El ABM sigue limitado a admin.
- Se agregaron listado de médicos con especialidades, búsqueda de pacientes, edición del perfil y gestión de usuarios.
- Se agregó disponibilidad de fechas y horarios. Los turnos duran **30 minutos**, desde la hora de entrada de cada agenda. No se ofrecen horarios pasados ni ocupados.
- El operador solo cambia agenda y turnos de su sede. El médico solo lo propio, aunque atienda en otra sede.
- La agenda valida especialidades asignadas, superposición y turnos existentes. Un rango con turnos asociados no se borra, para conservar el historial.
- Las reservas se hacen dentro de una transacción con bloqueo de la agenda. Dos solicitudes al mismo horario no generan dos turnos.
- Marcar como atendido acepta diagnóstico, tratamiento y observaciones y los guarda junto con el cambio de estado. Se conserva la alternativa de cargar historial después, por compatibilidad.
- Los listados de turnos incluyen nombres, sede, especialidad, fecha de nacimiento y resumen clínico.
- La auditoría registra altas y cambios de usuarios, además de las entidades anteriores. Se espera la escritura del log antes de enviar la respuesta; si la auditoría falla, se informa en el log del servidor y la operación ya realizada se conserva.
- El middleware de sesión consulta el rol y la sede actuales de la base, no solo los datos antiguos del token.

Los endpoints y cuerpos están en [API-FRONTEND.md](docs/API-FRONTEND.md), en `/docs` y en `postman/Clinica-Frontend-Final.postman_collection.json`.

## Pruebas y compilación

Con la base demo y la API levantadas:

```bash
npm run build
npm run test:integracion
```

El test usa la API real y crea datos de prueba. Verifica login, roles, duplicados, ABM, agenda, disponibilidad, reserva simultánea, cancelación, atención, historial, notificaciones, auditoría y reportes. No ejecutarlo contra una base de producción. Puede cambiarse la URL usando `API_URL`.

Las colecciones de semanas anteriores se conservan como referencia. Algunos resultados esperados cambiaron con el enunciado final, por ejemplo lectura de sedes y atención del médico en varias sedes. Para esta entrega usar la colección **Frontend Final**.

## Trabajo local

La rama local es `ajustes-frontend`. El remoto original se conserva y no se hicieron pushes. El frontend tiene un repositorio independiente en la carpeta vecina.
