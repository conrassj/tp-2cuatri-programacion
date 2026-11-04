require("dotenv").config();
const mysql = require("mysql2/promise");
const bcrypt = require("bcrypt");
async function main() {
  const c = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME,
  });
  try {
    await c.beginTransaction();
    const usuarios = [
      ["18222333", "Marcos", "Gomez", "admin", null, null, "admin123"],
      ["15200548", "Juan", "Perez", "operador", 1, null, "operador123"],
      ["20111222", "Ana", "Lopez", "medico", 1, null, "medico123"],
      ["25333444", "Carlos", "Ruiz", "medico", 2, null, "medico123"],
      ["27444555", "Lucía", "Fernandez", "medico", 1, null, "medico123"],
      ["36000960", "Franco", "Friggeri", "paciente", null, 1, "paciente123"],
    ];
    await c.query(
      "INSERT INTO especialidad(id,descripcion) VALUES(2,'Clínica médica'),(3,'Cardiología') ON DUPLICATE KEY UPDATE descripcion=VALUES(descripcion)",
    );
    await c.query(
      "INSERT INTO cobertura(id,nombre) VALUES(2,'Particular'),(3,'OSDE') ON DUPLICATE KEY UPDATE nombre=VALUES(nombre)",
    );
    const ids = {};
    for (const [
      dni,
      nombre,
      apellido,
      rol,
      sede,
      cobertura,
      password,
    ] of usuarios) {
      const [u] = await c.query("SELECT id FROM usuario WHERE dni=?", [dni]);
      if (u.length) {
        ids[dni] = u[0].id;
        await c.query("UPDATE usuario SET password=? WHERE id=?", [
          await bcrypt.hash(password, 10),
          u[0].id,
        ]);
      } else {
        const [r] = await c.query(
          "INSERT INTO usuario(nombre,apellido,dni,email,telefono,fecha_nacimiento,rol,id_sede,id_cobertura,password) VALUES(?,?,?,?,?,?,?,?,?,?)",
          [
            nombre,
            apellido,
            dni,
            dni + "@demo.test",
            "3424000000",
            "1985-06-15",
            rol,
            sede,
            cobertura,
            await bcrypt.hash(password, 10),
          ],
        );
        ids[dni] = r.insertId;
      }
    }
    for (const [dni, esp] of [
      ["20111222", 1],
      ["25333444", 2],
      ["27444555", 3],
    ]) {
      const id = ids[dni];
      const [e] = await c.query(
        "SELECT id FROM medico_especialidad WHERE id_medico=? AND id_especialidad=?",
        [id, esp],
      );
      if (!e.length)
        await c.query(
          "INSERT INTO medico_especialidad(id_medico,id_especialidad) VALUES(?,?)",
          [id, esp],
        );
    }
    // Fechas relativas al día de ejecución para que la demo no quede vencida.
    for (let dia = 0; dia < 8; dia++)
      for (const [dni, esp, sede, entrada, salida] of [
        ["20111222", 1, 1, "08:00", "12:00"],
        ["20111222", 1, 2, "15:00", "18:00"],
        ["25333444", 2, 2, "09:00", "13:00"],
        ["27444555", 3, 1, "10:00", "14:00"],
      ]) {
        const [a] = await c.query(
          "SELECT id FROM agenda WHERE id_medico=? AND id_sede=? AND fecha=DATE_ADD(CURDATE(),INTERVAL ? DAY) AND hora_entrada=?",
          [ids[dni], sede, dia, entrada],
        );
        if (!a.length)
          await c.query(
            "INSERT INTO agenda(id_medico,id_especialidad,id_sede,fecha,hora_entrada,hora_salida) VALUES(?,?,?,DATE_ADD(CURDATE(),INTERVAL ? DAY),?,?)",
            [ids[dni], esp, sede, dia, entrada, salida],
          );
      }
    const [agendas] = await c.query(
      "SELECT id,fecha FROM agenda WHERE id_medico=? AND id_sede=1 AND fecha=DATE_ADD(CURDATE(),INTERVAL 1 DAY) ORDER BY id LIMIT 1",
      [ids["20111222"]],
    );
    for (const [hora, estado] of [
      ["08:00", "confirmado"],
      ["08:30", "cancelado"],
      ["09:00", "atendido"],
    ]) {
      const [t] = await c.query(
        "SELECT id FROM turno WHERE id_agenda=? AND hora=? AND id_paciente=?",
        [agendas[0].id, hora, ids["36000960"]],
      );
      if (t.length) continue;
      const [r] = await c.query(
        "INSERT INTO turno(nota,id_agenda,fecha,hora,id_paciente,id_cobertura,estado) VALUES(?,?,?,?,?,1,?)",
        [
          "Consulta de demostración",
          agendas[0].id,
          agendas[0].fecha,
          hora,
          ids["36000960"],
          estado,
        ],
      );
      if (estado === "atendido")
        await c.query(
          "INSERT INTO historial_clinico(id_turno,id_medico,id_paciente,diagnostico,tratamiento,observaciones) VALUES(?,?,?,?,?,?)",
          [
            r.insertId,
            ids["20111222"],
            ids["36000960"],
            "Control de demostración",
            "Indicaciones de prueba",
            "Registro ficticio para probar la pantalla",
          ],
        );
    }
    await c.commit();
    console.log(
      "Datos de demostración cargados: 4 roles, 3 médicos y agendas en 2 sedes.",
    );
  } catch (e) {
    await c.rollback();
    throw e;
  } finally {
    await c.end();
  }
}
main().catch((e) => {
  console.error(e.message);
  process.exitCode = 1;
});
