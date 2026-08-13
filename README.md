# Backend — Sistema de Gestión de Turnos Médicos

Trabajo Práctico Integrador — Programación 2
**Etapa: Backend — Semana 1** (setup, conexión a la base y autenticación)

## Stack

- Node.js + Express
- MySQL / MariaDB (driver `mysql2`)
- Autenticación con JWT (`jsonwebtoken`)
- Contraseñas hasheadas con `bcrypt`

## Estructura del proyecto

```
src/
  controllers/     -> lógica de cada endpoint
  routes/           -> definición de rutas
  middlewares/      -> verificarToken, verificarRol
  database/         -> conexión (pool) a MySQL
  utils/            -> helper de respuesta uniforme
  app.js            -> configuración de Express
  server.js         -> punto de entrada
database/
  clinica_ampliada.sql  -> script de base de datos provisto por la cátedra
postman/
  TP_Backend_Semana1.postman_collection.json
```

## Puesta en marcha

1. Instalar dependencias:
   ```bash
   npm install
   ```

2. Crear la base de datos e importar el script:
   ```bash
   mysql -u root -p -e "CREATE DATABASE clinica"
   mysql -u root -p clinica < database/clinica_ampliada.sql
   ```

3. Copiar `.env.example` como `.env` y completar con tus credenciales locales:
   ```bash
   cp .env.example .env
   ```

4. Levantar el servidor en modo desarrollo:
   ```bash
   npm run dev
   ```

   El servidor queda escuchando en `http://localhost:3000` (o el puerto que hayas definido en `.env`).

## ¿Por qué hay dos archivos de entorno?

- `.env.example`: se sube al repositorio. Es una plantilla que muestra qué variables necesita el proyecto, sin valores reales.
- `.env`: queda **solo en tu máquina**, tiene tus credenciales reales y está en `.gitignore` para que nunca se suba a GitHub.

## Endpoints

| Método | Ruta | Descripción | Protección |
|---|---|---|---|
| GET | `/health` | Prueba la conexión a la base de datos | Pública |
| GET | `/coberturas` | Lista las coberturas disponibles para el registro | Pública |
| POST | `/auth/registro` | Registra un paciente (rol `paciente` automático) | Pública |
| POST | `/auth/login` | Login con `dni` y `password`, devuelve JWT | Pública |
| GET | `/auth/perfil` | Devuelve los datos del usuario logueado | `verificarToken` |
| GET | `/auth/admin-test` | Endpoint de prueba para roles | `verificarToken` + `verificarRol('admin','operador')` |

## Formato de respuesta uniforme

Todas las respuestas (éxito y error) siguen esta estructura:

```json
{
  "codigo": 200,
  "estado": "ok",
  "datos": { }
}
```

En caso de error, `estado` lleva el mensaje descriptivo y `codigo` el código HTTP correspondiente (400, 401, 403, 404, 409, 500).

## Pruebas

Importar `postman/TP_Backend_Semana1.postman_collection.json` en Postman. Incluye:
- Health check
- Listado de coberturas
- Registro de paciente
- Login (guarda el token automáticamente en una variable de colección)
- Perfil con token (200) y sin token (401 esperado)
- Endpoint restringido por rol (403 esperado para un paciente)
