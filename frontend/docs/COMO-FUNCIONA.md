# Cómo está armado el front

## Un ejemplo para ubicarnos

Cuando un paciente pide un turno, la pantalla `nuevo-turno` muestra los pasos. Cada selección hace una consulta a la API. El front no inventa los médicos ni calcula qué turnos están ocupados: esa información viene del backend.

Al confirmar, manda especialidad, sede, médico, fecha, hora y nota. La cobertura la toma el backend del paciente. Si otra persona reservó ese horario mientras tanto, la API rechaza el pedido y el front vuelve al paso de horario con el mensaje recibido.

## Componente, HTML y servicio

- El archivo `.component.html` dice qué se ve: campos, botones, tablas y mensajes.
- El `.component.ts` guarda los datos de esa pantalla y define qué pasa al hacer clic.
- `ApiService` hace las peticiones. Todas parten de la URL de `environment.ts`.

Por ejemplo, `this.api.get('/sedes')` pide las sedes. La respuesta del back viene como `{ codigo, estado, datos }`. El servicio devuelve la parte `datos`, así las pantallas no repiten ese paso.

## Cómo guardamos la sesión

El login devuelve un token y los datos del usuario. Guardamos el token en `localStorage` para mantener la sesión al recargar. No guardamos la contraseña.

Cuando la aplicación arranca, pide `/auth/perfil` con ese token. El rol que usa el menú sale de ese perfil. Al cerrar sesión se borra el token y se vuelve al inicio.

El **interceptor** se ejecuta antes y después de cada petición a nuestra API. Agrega el token cuando hace falta, lleva la cuenta de las peticiones pendientes para mostrar la barra de carga y maneja los errores. Si la API contesta 401 en una ruta protegida, vuelve al login.

## Para qué sirve el guard

Ocultar un enlace no alcanza: alguien puede escribir la URL a mano. `rolGuard` revisa la sesión y compara el rol con los roles permitidos de la ruta. Sin sesión manda al login. Con otro rol manda a “Acceso denegado”.

Esto ayuda en la interfaz, pero la seguridad real también se valida en el backend. No alcanza con confiar en lo que mande el navegador.

## Qué son los signals

Un signal guarda un valor que Angular puede seguir. Por ejemplo, `items = signal([])` guarda el listado. Se lee con `items()` y se cambia con `items.set(nuevoListado)`. Al cambiarlo, Angular actualiza lo que se ve sin recargar la página.

Para campos sencillos usamos `ngModel`. En registro, login, perfil y el diálogo reutilizable usamos formularios reactivos, porque permiten juntar validaciones y mostrar errores por campo.

## Por qué hay un formulario compartido

Sedes, coberturas y otros formularios tienen varias cosas en común: campos, botones Guardar/Volver, validaciones y mensaje de error. `FormularioComponent` recibe la lista de campos y una función para guardar.

El diálogo queda abierto si el backend rechaza el cambio. Solo se cierra cuando la operación salió bien. Mientras está guardando se deshabilitan los botones para evitar envíos repetidos.

## Fechas y horarios

Las fechas viajan como `YYYY-MM-DD`, porque así las espera la API. En pantalla se muestran con el pipe `date` en formato `dd/MM/yyyy`. Para la fecha de hoy usamos la hora local, sin convertirla a UTC. La edad se calcula teniendo en cuenta si ya pasó el cumpleaños de este año.

Cada turno dura 30 minutos. El backend calcula los horarios a partir de los rangos de agenda y descarta los ocupados. También vuelve a validar todo al reservar.

## Cómo se actualizan los listados

Después de guardar, editar o borrar, volvemos a consultar el listado. Si hay un error, mostramos el mensaje y dejamos los datos anteriores. En las búsquedas con varios filtros usamos un número de solicitud: si una respuesta vieja llega tarde, no reemplaza a la nueva.

## Atención e historial

El médico abre un turno y carga diagnóstico, tratamiento y observaciones. El frontend manda todo junto a `PATCH /turnos/:id/atender`. El backend guarda el estado y el historial en una transacción: si falla una parte, revierte todo.

Los turnos viejos que ya estén atendidos pero no tengan historial muestran “Cargar historial”. Eso permite completar registros hechos con el backend anterior.

## Reportes

Los cuatro reportes usan el mismo rango de fechas. Se piden juntos y se actualizan juntos cuando llegan todas las respuestas. Chart.js dibuja los gráficos de barras. También mostramos las cantidades como texto para poder leerlas sin depender del gráfico.

## Dónde cambiar algo

| Quiero cambiar… | Archivo o carpeta |
| --- | --- |
| Colores y espacios | `src/styles.scss` |
| URL del backend | `src/environments/environment.ts` |
| Opciones del menú | `src/app/app.component.ts` |
| Rutas y roles permitidos | `src/app/app.routes.ts` |
| Datos de contacto del pie | `src/app/app.component.html` |
| Una pantalla | `src/app/pages/` |
| Validaciones del registro | `src/app/pages/auth.component.ts` |
| Texto del diálogo de confirmación | `src/app/shared/confirmar.component.html` |

Antes de entregar conviene recorrer los cuatro roles y poder explicar una petición completa: desde el clic, pasando por el servicio y el endpoint, hasta la consulta a la base.
