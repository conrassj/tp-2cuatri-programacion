# Recorrido para practicar la defensa

## Antes de empezar

1. Encender MySQL/MariaDB.
2. Levantar el back con `npm run dev` y comprobar `/health`.
3. Levantar el front con `npm start`.
4. Si las agendas quedaron viejas, ejecutar `npm run db:demo` en el back. Genera agendas para los días actuales; conserva los registros existentes y restablece las contraseñas de las cuentas demo.

Los datos son ficticios. El seed incluye registros de ejemplo en los tres estados, incluso una atención de demostración en la agenda próxima, para poder mostrar todas las pantallas.

## Paciente

1. Entrar con DNI `36000960`, contraseña `paciente123`.
2. Abrir Nuevo turno: especialidad, sede, médico, fecha y horario.
3. Escribir una nota y revisar el resumen con la cobertura.
4. Confirmar y verificar que aparece en Mis turnos y en la campana.
5. Abrir un turno atendido y mostrar diagnóstico, tratamiento y observaciones.
6. Cancelar un turno confirmado y ver el nuevo estado.
7. En Mis datos, cambiar teléfono o cobertura. Probar dos contraseñas diferentes: no debe enviar el cambio.
8. Recargar la página: debe seguir la sesión. Escribir `/admin/usuarios`: debe denegar el acceso.

## Médico

1. Entrar con DNI `20111222`, contraseña `medico123`.
2. Ver Mi agenda. Ana tiene horarios en Centro y Norte.
3. Agregar un rango en otra fecha. Probar salida anterior a entrada y un horario superpuesto.
4. Intentar borrar una agenda con turnos confirmados: no debe permitirse.
5. En Turnos programados, elegir fecha y sede, abrir el detalle y leer la nota.
6. Marcar como atendido y completar diagnóstico, tratamiento y observaciones.
7. Buscar al paciente por DNI en Historial clínico. Ver solo los registros de ese médico.
8. Entrar como Carlos (`25333444`) y comprobar que no ve la agenda ni el historial de Ana.

## Operador

1. Entrar con DNI `15200548`, contraseña `operador123`.
2. Ver la agenda de Centro. Cambiar a Norte: puede consultar, pero los botones de edición quedan deshabilitados.
3. Nueva agenda permite elegir cualquier médico del listado, aunque todavía no tenga horarios en esa sede.
4. Registrar un paciente y buscarlo por DNI.
5. Asignar turno: primero elegir al paciente; la sede queda fija en Centro.
6. Ver los turnos de la sede y cancelar uno con confirmación previa.

## Administrador

1. Entrar con DNI `18222333`, contraseña `admin123`.
2. Crear, editar y eliminar una cobertura de prueba sin dependencias.
3. Intentar eliminar una sede que tenga usuarios o agendas: debe aparecer el motivo y conservarse la fila.
4. Crear un operador o médico. Para un médico, elegir sede y especialidades.
5. Filtrar usuarios por apellido, tipo y sede. Editar también un paciente.
6. Abrir Auditoría y filtrar por entidad o usuario. Ver el alta y la modificación.
7. Abrir Reportes y cambiar el rango de fechas. Revisar los gráficos y la tasa de cancelación.

## Errores que conviene mostrar

- Login con contraseña equivocada.
- Registro con DNI o email repetido.
- Alta de agenda con horario inválido.
- Baja de una entidad con dependencias.
- Acceso a una ruta sin sesión o con otro rol.
- Backend apagado: el front muestra un mensaje y sigue permitiendo navegar.
- Horario que se ocupa antes de confirmar: vuelve al paso de selección.

## Preguntas para practicar

- ¿Por qué el token se agrega en un interceptor?
- ¿Qué diferencia hay entre el guard del frontend y los permisos del backend?
- ¿Por qué no se manda la cobertura elegida en el body del turno?
- ¿Qué hace una transacción al reservar o atender?
- ¿Cómo se evita que una respuesta vieja reemplace los filtros actuales?
- ¿Dónde se cambia la URL de la API?
