# Verificación de la entrega

Fecha: 4 de noviembre de 2026.

## Entorno usado

- Windows, Node.js 24.15.0.
- Angular 21 y Angular Material 21.
- MariaDB 10.4.32, instancia aislada en puerto 3307.
- API en puerto 3000 y frontend en 4200.
- Revisión visual en navegador de escritorio a 1440 px de ancho.

## Compilación y pruebas

| Comprobación | Resultado |
| --- | --- |
| `npm run build` en backend | Correcto |
| `npm run build` en frontend | Correcto, sin errores de compilación |
| `npm test -- --watch=false` en frontend | 7 pruebas aprobadas |
| `npm run test:integracion` en backend | 70 verificaciones HTTP aprobadas, más aserciones de datos |
| Dos reservas simultáneas del mismo horario | Una devuelve 201 y la otra 409 |
| Lectura y modificación fuera del rol permitido | Rechazadas según la ruta |
| Operador intentando modificar otra sede | 403; botones deshabilitados en la interfaz |
| Médico atendiendo un turno propio en otra sede | Permitido |
| Borrar agenda con turnos o recortar su horario | Rechazado con mensaje controlado |
| Historial de otro médico | No se devuelve |
| Notificación de otro usuario | No se puede marcar como leída |
| Usuario creado/editado | Aparece en el listado y en auditoría |

Las pruebas del frontend cubren rutas sin sesión, rutas de otro rol, restauración del perfil, autorización solo hacia nuestra API, vencimiento y error de credenciales. El indicador de carga se libera también al fallar una petición.

La primera ejecución del test de frontend encontró un bloqueo de permisos en la carpeta temporal de Windows. Se repitió usando una carpeta temporal dentro de `work/test-temp` y las siete pruebas pasaron. No fue un error del código de la aplicación.

## Recorridos verificados en el navegador

- Administrador: login, inicio, reportes con gráficos, listado de usuarios y formulario de edición del médico con sus especialidades.
- Paciente: login, reserva completa con nota, confirmación, listado del turno creado y aumento de la campana.
- Paciente escribiendo una URL de administración: aparece Acceso denegado. Se mantuvo la sesión al recargar antes de validar el rol.
- Operador: agenda de su sede y consulta de otra sede con los botones de edición deshabilitados.
- Médico: tabla de turnos con hora, paciente, edad, sede y estado; apertura de nota; atención con diagnóstico, tratamiento y observaciones; visualización del resumen guardado.
- Sin errores de JavaScript observados durante estos recorridos.

La captura `capturas/atencion-medica.jpg` muestra una atención de demostración guardada desde el navegador.

## Alcance

Se verificó una instalación local con datos ficticios. La entrega no está publicada en un servidor y no se hicieron cambios remotos en GitHub. Los datos de contacto del pie y los usuarios del seed son de demostración. No se probaron todos los navegadores ni se hizo una prueba de carga de producción.

Para otra computadora hay que instalar las dependencias y configurar su propia conexión a MySQL siguiendo los README. El ZIP contiene fuentes y documentación; excluye `.env`, `node_modules`, compilaciones y carpetas de Git.
