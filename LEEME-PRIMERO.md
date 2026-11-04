# Clínica virtual — proyecto final

El proyecto está separado en dos carpetas:

- `backend`: API de Express y MySQL, basada en el repositorio de Requena y Conra. Rama local `ajustes-frontend`.
- `frontend`: aplicación Angular 21 con Material. Repositorio independiente, rama local `entrega-frontend`.

No se subieron cambios a GitHub. Los dos proyectos se pueden abrir y ejecutar por separado.

## Abrir en Visual Studio Code

Ejecutá `Abrir-en-Visual.ps1`, o abrí cada archivo `.code-workspace` con Visual Studio Code. Se abren dos ventanas: una para el back y otra para el front.

## En esta computadora

Se preparó una base de demostración independiente en `../work/mysql-data`, usando el motor de XAMPP en el puerto **3307**. No usa la carpeta de datos habitual de XAMPP.

1. Ejecutá `Iniciar-base-local.ps1` para encender esa base si está apagada.
2. En la terminal de la ventana del backend: `npm run dev`.
3. En la terminal de la ventana del frontend: `npm start`.
4. Abrí `http://localhost:4200`.

Las dependencias ya están instaladas en ambas carpetas. Si reiniciás la PC, volvé a levantar la base y ambos proyectos. La base local necesita que la carpeta `work` siga junto a `outputs`.

## Para llevarlo a otra computadora

Usá `proyecto-final-fuentes.zip` o copiá las dos carpetas sin `node_modules`. Seguí el README del backend para crear una base vacía, configurar `.env` y cargar los datos. Después seguí el README del frontend.

Los scripts locales de XAMPP son una ayuda para esta computadora; no son necesarios en otra instalación. En otra computadora podés usar MySQL/MariaDB en su puerto habitual, normalmente 3306.

## Usuarios de demostración

| Rol | DNI | Contraseña |
| --- | --- | --- |
| Administrador | 18222333 | admin123 |
| Operador | 15200548 | operador123 |
| Médica Ana López | 20111222 | medico123 |
| Médico Carlos Ruiz | 25333444 | medico123 |
| Médica Lucía Fernández | 27444555 | medico123 |
| Paciente | 36000960 | paciente123 |

Estos accesos son únicamente para la base de demostración. Los datos de contacto del pie de página también son de demostración.

## Qué leer

1. `frontend/README.md`: cómo instalar y ejecutar el front.
2. `frontend/docs/COMO-FUNCIONA.md`: explicación del código en lenguaje sencillo.
3. `frontend/docs/GUIA-DEFENSA.md`: recorrido de prueba de los cuatro roles.
4. `backend/README.md`: base de datos, API y cambios necesarios para la integración.
5. `backend/docs/API-FRONTEND.md`: endpoints y reglas de acceso.
6. `VERIFICACION.md`: pruebas realizadas y alcance.
