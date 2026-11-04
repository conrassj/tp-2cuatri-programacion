// Ejecutar sobre una base de demostración, con la API levantada.
const assert = require("node:assert/strict");
const base = process.env.API_URL || "http://localhost:3000";
let cantidad = 0;
const tokens = {};
async function api(metodo, ruta, rol, body, codigo = 200) {
  const r = await fetch(base + ruta, {
    method: metodo,
    headers: {
      "Content-Type": "application/json",
      ...(rol ? { Authorization: "Bearer " + tokens[rol] } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const d = await r.json();
  assert.equal(r.status, codigo, `${metodo} ${ruta}: ${JSON.stringify(d)}`);
  assert.equal(d.codigo, codigo);
  cantidad++;
  return d.datos;
}
async function main() {
  await api("GET", "/health");
  for (const [rol, dni, password] of [
    ["admin", "18222333", "admin123"],
    ["operador", "15200548", "operador123"],
    ["medico", "20111222", "medico123"],
    ["medico2", "25333444", "medico123"],
    ["paciente", "36000960", "paciente123"],
  ])
    tokens[rol] = (
      await api("POST", "/auth/login", null, { dni, password })
    ).token;
  await api(
    "POST",
    "/auth/login",
    null,
    { dni: "18222333", password: "incorrecta" },
    401,
  );
  await api("GET", "/auth/perfil", null, null, 401);
  const paciente = await api("GET", "/auth/perfil", "paciente");
  const medico = await api("GET", "/auth/perfil", "medico");
  for (const rol of ["medico", "operador", "paciente"]) {
    await api("GET", "/usuarios", rol, null, 403);
    await api("GET", "/auditoria", rol, null, 403);
    await api("GET", "/reportes/tasa-cancelacion", rol, null, 403);
    await api("GET", "/sedes", rol);
    await api("GET", "/especialidades", rol);
  }
  await api("GET", "/medicos", "paciente");
  await api("GET", "/coberturas/disponibles");
  const suffix = Date.now().toString().slice(-7),
    dni = "8" + suffix;
  const datos = {
    nombre: "Prueba",
    apellido: "Integracion" + suffix,
    dni,
    email: suffix + "@prueba.test",
    telefono: "3424000000",
    fecha_nacimiento: "1998-01-15",
    password: "prueba123",
    id_cobertura: 1,
  };
  const nuevo = await api("POST", "/auth/registro", null, datos, 201);
  tokens.nuevo = (
    await api("POST", "/auth/login", null, { dni, password: "prueba123" })
  ).token;
  await api("POST", "/auth/registro", null, datos, 409);
  await api(
    "POST",
    "/auth/registro",
    null,
    { ...datos, dni: "123", email: "otro@prueba.test" },
    400,
  );
  await api(
    "PUT",
    "/pacientes/perfil",
    "nuevo",
    { nombre: "No permitido" },
    400,
  );
  await api("PUT", "/pacientes/perfil", "nuevo", {
    email: datos.email,
    telefono: "3424000001",
    id_cobertura: 2,
  });
  await api("DELETE", "/sedes/1", "admin", null, 409);
  await api("DELETE", "/especialidades/1", "admin", null, 409);
  const sede = await api(
    "POST",
    "/sedes",
    "admin",
    {
      nombre: "Prueba " + suffix,
      direccion: "Calle de prueba",
      telefono: "3424000000",
    },
    201,
  );
  await api("PUT", "/sedes/" + sede.id, "admin", {
    nombre: "Editada " + suffix,
    direccion: "Otra dirección",
    telefono: "3424000001",
  });
  await api("DELETE", "/sedes/" + sede.id, "admin");
  const operadorNuevo = await api(
    "POST",
    "/usuarios",
    "admin",
    {
      ...datos,
      dni: "7" + suffix,
      email: "u" + suffix + "@prueba.test",
      rol: "operador",
      id_sede: 1,
    },
    201,
  );
  await api("PUT", "/usuarios/" + operadorNuevo.id, "admin", {
    ...operadorNuevo,
    password: "",
    apellido: "Editado " + suffix,
    rol: "operador",
  });
  const usuarios = await api(
    "GET",
    "/usuarios?apellido=Editado&pagina=1",
    "admin",
  );
  assert.ok(usuarios.items.some((u) => u.id === operadorNuevo.id));
  const fecha = new Date(Date.now() + 12 * 86400000).toISOString().slice(0, 10);
  // Elegimos un horario libre para que se pueda repetir sin borrar turnos previos.
  const existentes = await api("GET", "/agendas?fecha=" + fecha, "medico");
  let hora = 6;
  while (existentes.some((a) => Number(a.hora_entrada.slice(0, 2)) === hora))
    hora++;
  const entrada = String(hora).padStart(2, "0") + ":00",
    salida = String(hora + 1).padStart(2, "0") + ":00";
  const agendaDatos = {
    id_medico: medico.id,
    id_sede: 2,
    id_especialidad: 1,
    fecha,
    hora_entrada: entrada,
    hora_salida: salida,
  };
  await api("POST", "/agendas", "operador", agendaDatos, 403);
  await api("POST", "/agendas", "medico2", agendaDatos, 403);
  const agenda = await api("POST", "/agendas", "medico", agendaDatos, 201);
  await api("PUT", "/agendas/" + agenda.id, "operador", agendaDatos, 403);
  await api("DELETE", "/agendas/" + agenda.id, "operador", null, 403);
  const q = `?id_medico=${medico.id}&id_sede=2&id_especialidad=1&fecha=${fecha}`;
  const disp = await api("GET", "/disponibilidad" + q, "paciente");
  assert.equal(
    disp.horarios.filter((h) => h.id_agenda === agenda.id).length,
    2,
  );
  const turnoDatos = {
    id_medico: medico.id,
    id_especialidad: 1,
    id_sede: 2,
    fecha,
    hora: entrada,
    nota: "Prueba de integración",
  };
  await api(
    "POST",
    "/turnos",
    "operador",
    { ...turnoDatos, id_paciente: nuevo.id },
    403,
  );
  await api(
    "POST",
    "/turnos",
    "nuevo",
    { ...turnoDatos, hora: entrada.slice(0, 3) + "15" },
    400,
  );
  // Dos requests simultáneos: solo uno puede reservar.
  const respuestas = await Promise.all(
    [1, 2].map(() =>
      fetch(base + "/turnos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + tokens.nuevo,
        },
        body: JSON.stringify(turnoDatos),
      }),
    ),
  );
  assert.deepEqual(respuestas.map((r) => r.status).sort(), [201, 409]);
  cantidad += 2;
  const exitoso = await respuestas.find((r) => r.status === 201).json();
  const turno = exitoso.datos;
  await api("DELETE", "/agendas/" + agenda.id, "medico", null, 409);
  await api(
    "PUT",
    "/agendas/" + agenda.id,
    "medico",
    { ...agendaDatos, hora_entrada: entrada.slice(0, 3) + "30" },
    409,
  );
  await api("PATCH", "/turnos/" + turno.id + "/cancelar", "paciente", {}, 403);
  await api(
    "PATCH",
    "/turnos/" + turno.id + "/atender",
    "medico2",
    { diagnostico: "No permitido" },
    403,
  );
  await api("PATCH", "/turnos/" + turno.id + "/atender", "medico", {
    diagnostico: "Diagnóstico de prueba",
    tratamiento: "Tratamiento de prueba",
    observaciones: "Observación de prueba",
  });
  const misTurnos = await api("GET", "/turnos/mios", "nuevo");
  assert.ok(
    misTurnos.some(
      (t) =>
        t.id === turno.id &&
        t.diagnostico === "Diagnóstico de prueba" &&
        t.sede,
    ),
  );
  const historial = await api(
    "GET",
    "/historial/paciente/" + nuevo.id,
    "medico",
  );
  assert.equal(historial.length, 1);
  assert.equal(
    (await api("GET", "/historial/paciente/" + nuevo.id, "medico2")).length,
    0,
  );
  const segundo = await api(
    "POST",
    "/turnos",
    "nuevo",
    { ...turnoDatos, hora: entrada.slice(0, 3) + "30" },
    201,
  );
  await api("PATCH", "/turnos/" + segundo.id + "/cancelar", "medico", {});
  const avisos = await api("GET", "/notificaciones", "nuevo");
  assert.ok(avisos.length >= 3);
  await api(
    "PATCH",
    "/notificaciones/" + avisos[0].id + "/leida",
    "paciente",
    {},
    404,
  );
  await api("PATCH", "/notificaciones/" + avisos[0].id + "/leida", "nuevo", {});
  for (const ruta of [
    "turnos-por-especialidad",
    "turnos-por-sede",
    "ranking-medicos",
    "tasa-cancelacion",
  ])
    await api(
      "GET",
      "/reportes/" + ruta + "?desde=" + fecha + "&hasta=" + fecha,
      "admin",
    );
  const logs = await api("GET", "/auditoria?entidad=usuario", "admin");
  assert.ok(
    logs.some((l) => l.id_entidad === operadorNuevo.id && l.accion === "ALTA"),
  );
  assert.ok(
    logs.some(
      (l) => l.id_entidad === operadorNuevo.id && l.accion === "MODIFICACION",
    ),
  );
  console.log(
    `OK: ${cantidad} verificaciones HTTP + comprobaciones de datos, concurrencia y permisos.`,
  );
}
main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
