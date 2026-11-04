// Crea una base nueva. Si ya hay tablas, corta para no pisar datos.
require("dotenv").config();
const mysql = require("mysql2/promise");
const fs = require("node:fs/promises");
const path = require("node:path");
async function main() {
  const nombre = process.env.DB_NAME || "clinica_final";
  if (!/^[a-zA-Z0-9_]+$/.test(nombre)) throw Error("Nombre de base inválido");
  const c = await mysql.createConnection({
    host: process.env.DB_HOST || "127.0.0.1",
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    multipleStatements: true,
  });
  try {
    await c.query(
      `CREATE DATABASE IF NOT EXISTS \`${nombre}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci`,
    );
    await c.query(`USE \`${nombre}\``);
    const [tablas] = await c.query("SHOW TABLES");
    if (tablas.length)
      throw Error(
        "La base ya tiene tablas. Elegí una base vacía en DB_NAME. No se borró nada.",
      );
    let sql = await fs.readFile(
      path.join(__dirname, "../docs/clinica_ampliada.sql"),
      "utf8",
    );
    // La estructura original usa tinyint: con INT evitamos el límite de 127 registros.
    sql = sql.replace(/tinyint\(\d+\)/gi, "int");
    await c.query(sql);
    await c.query(
      "ALTER TABLE usuario ADD UNIQUE KEY uq_usuario_dni(dni), ADD UNIQUE KEY uq_usuario_email(email); ALTER TABLE historial_clinico ADD UNIQUE KEY uq_historial_turno(id_turno);",
    );
    console.log("Base creada. Ahora ejecutá npm run db:demo.");
  } finally {
    await c.end();
  }
}
main().catch((e) => {
  console.error(e.message);
  process.exitCode = 1;
});
