# Frontend — Clínica virtual

Proyecto final de Programación 2. Desde esta aplicación se pueden pedir turnos, organizar agendas, registrar atenciones y administrar la clínica.

## Tecnologías

- Node.js usado: **24.15.0**.
- Angular y Angular CLI: **21.2.x**. Material y CDK: **21.x**.
- TypeScript: **5.9.x**.
- Gráficos: **Chart.js 4**, usado directamente desde un componente Angular.
- Aplicación sin SSR, con componentes standalone y carga de pantallas por ruta.

Las versiones exactas instaladas están en `package-lock.json`. Para repetir esa instalación usá `npm ci`. También funciona `npm install`.

## Cómo levantarlo

Primero levantá el backend y su base siguiendo `../backend/README.md`.

En una terminal dentro de `frontend`:

```bash
npm install
npm start
```

Abrí **http://localhost:4200**. `npm start` ejecuta `ng serve`; no hace falta instalar Angular CLI globalmente. También podés usar `npx ng serve`.

Para compilar:

```bash
npm run build
```

La compilación queda en `dist/frontend/browser`. Si la servís en otro servidor, configurá que las rutas que no son archivos devuelvan `index.html`, porque la navegación la maneja Angular.

## Conexión con el backend

La URL se define una sola vez en `src/environments/environment.ts`:

```ts
export const environment = { apiUrl: 'http://localhost:3000' };
```

El frontend no lleva `.env` ni credenciales de la base. Si cambiás el puerto de la API, modificá esa URL. Si cambiás el origen del frontend, revisá `CORS_ORIGEN` en el backend. Usá `localhost:4200` en el navegador para coincidir con el origen configurado.

El backend tiene que ser la versión incluida en esta entrega: la primera entrega sola no tiene todos los endpoints que necesita el front.

## Usuarios de prueba

Después de ejecutar `npm run db:demo` en el backend:

| Rol | DNI | Contraseña |
| --- | --- | --- |
| admin | 18222333 | admin123 |
| operador | 15200548 | operador123 |
| medico | 20111222 | medico123 |
| medico | 25333444 | medico123 |
| medico | 27444555 | medico123 |
| paciente | 36000960 | paciente123 |

## Carpetas

```text
src/app/
  models/      tipos de los datos y funciones de fecha
  services/    conexión con la API, sesión, interceptor y guard
  shared/      formularios, confirmaciones, buscador y gráfico
  pages/       pantallas, cada una con su HTML y TypeScript
  app.routes.ts
  app.component.html
src/environments/environment.ts
```

La apariencia general está en `src/styles.scss`. Los formularios, botones, tablas, menús, avisos y diálogos usan Angular Material. La fuente de íconos se sirve localmente desde `public/fonts`.

## Qué puede hacer cada rol

- **Paciente:** registrarse, sacar turnos, cancelarlos, ver el resumen de sus atenciones y editar contacto, contraseña y cobertura.
- **Médico:** gestionar su agenda en varias sedes, ver sus turnos, atender con diagnóstico y consultar el historial que registró.
- **Operador:** consultar agendas de todas las sedes; modificar agenda, asignar y cancelar turnos en su sede; registrar y buscar pacientes.
- **Administrador:** ABM de sedes, especialidades y coberturas; alta y edición de usuarios; auditoría y reportes.

Todos tienen perfil y notificaciones. El menú y el guard controlan qué rutas se pueden abrir, y el backend vuelve a validar los permisos.

## Pruebas

```bash
npm test -- --watch=false
```

Se prueban accesos por rol, restauración de sesión, envío del token, errores de login y vencimiento de sesión. Los recorridos completos se verifican con el backend real; el script está en `../backend/scripts/pruebas-integracion.cjs`.

Más explicaciones: [Cómo funciona](docs/COMO-FUNCIONA.md) y [Guía para la defensa](docs/GUIA-DEFENSA.md).

## Git

Este frontend tiene su propio repositorio local y la rama `entrega-frontend`. No tiene remoto configurado. Para entregarlo, creá un repositorio vacío para el front y agregalo como `origin`; el backend se entrega por separado. Nunca subas `node_modules`, `.angular` ni `dist`.
