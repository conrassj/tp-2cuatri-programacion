import bcrypt from "bcrypt";
import { RowDataPacket, ResultSetHeader } from "mysql2";
import { pool } from "../database/conexion";
import { ErrorHttp } from "../utils/errorHttp";
import { validarRegistro } from "../validators/auth.validators";
import { buscarPublicoPorId } from "./usuario.service";

export async function listarUsuarios(q: Record<string, unknown>) {
  const condiciones = ["1=1"],
    valores: unknown[] = [];
  for (const c of ["nombre", "apellido", "rol", "id_sede"])
    if (q[c]) {
      condiciones.push(
        `${c} ${c === "nombre" || c === "apellido" ? "LIKE" : "="} ?`,
      );
      valores.push(c === "nombre" || c === "apellido" ? `%${q[c]}%` : q[c]);
    }
  const pagina = Math.max(1, Number(q.pagina) || 1),
    limite = 10;
  const where = condiciones.join(" AND ");
  const [total] = await pool.query<RowDataPacket[]>(
    `SELECT COUNT(*) total FROM usuario WHERE ${where}`,
    valores,
  );
  const [items] = await pool.query<RowDataPacket[]>(
    `SELECT id,nombre,apellido,dni,email,telefono,fecha_nacimiento,rol,id_sede,id_cobertura FROM usuario WHERE ${where} ORDER BY apellido,nombre,id LIMIT ? OFFSET ?`,
    [...valores, limite, (pagina - 1) * limite],
  );
  for (const u of items) {
    const [e] = await pool.query<RowDataPacket[]>(
      "SELECT id_especialidad FROM medico_especialidad WHERE id_medico=?",
      [u.id],
    );
    u.especialidades = e.map((x) => x.id_especialidad);
  }
  return { items, total: Number(total[0].total) };
}

export async function guardarUsuario(
  cuerpo: Record<string, unknown>,
  id?: number,
) {
  const anterior = id ? await buscarPublicoPorId(id) : null;
  if (id && !anterior) throw new ErrorHttp(404, "Usuario no encontrado");
  const rol = String(cuerpo.rol);
  if (
    !["admin", "operador", "medico", "paciente"].includes(rol) ||
    (!id && rol === "paciente")
  )
    throw new ErrorHttp(400, "Tipo de usuario no permitido");
  if (anterior && anterior.rol !== rol)
    throw new ErrorHttp(
      400,
      "El tipo de un usuario existente no se cambia; editá sus datos dentro de su rol",
    );
  // Reutilizamos las mismas validaciones del registro. La contraseña vacía conserva la anterior.
  const datos = validarRegistro({
    ...cuerpo,
    password: cuerpo.password || (id ? "sin-cambio" : undefined),
    id_cobertura: rol === "paciente" ? cuerpo.id_cobertura : 1,
  });
  const sede = ["medico", "operador"].includes(rol)
    ? Number(cuerpo.id_sede)
    : null;
  const cobertura = rol === "paciente" ? datos.id_cobertura : null;
  const especialidades =
    rol === "medico" && Array.isArray(cuerpo.especialidades)
      ? [...new Set(cuerpo.especialidades.map(Number))]
      : [];
  if (
    rol === "medico" &&
    (!especialidades.length ||
      especialidades.some((e) => !Number.isInteger(e) || e < 1))
  )
    throw new ErrorHttp(400, "Elegí al menos una especialidad");
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    if (sede !== null) {
      const [s] = await conn.query<RowDataPacket[]>(
        "SELECT id FROM sede WHERE id=?",
        [sede],
      );
      if (!s.length) throw new ErrorHttp(400, "Elegí una sede válida");
    }
    if (cobertura) {
      const [c] = await conn.query<RowDataPacket[]>(
        "SELECT id FROM cobertura WHERE id=?",
        [cobertura],
      );
      if (!c.length) throw new ErrorHttp(400, "La cobertura no existe");
    }
    for (const e of especialidades) {
      const [s] = await conn.query<RowDataPacket[]>(
        "SELECT id FROM especialidad WHERE id=?",
        [e],
      );
      if (!s.length) throw new ErrorHttp(400, "La especialidad no existe");
    }
    const [duplicados] = await conn.query<RowDataPacket[]>(
      "SELECT id FROM usuario WHERE (dni=? OR email=?) AND id<>?",
      [datos.dni, datos.email, id || 0],
    );
    if (duplicados.length)
      throw new ErrorHttp(409, "El DNI o email ya está registrado");
    const valores = [
      datos.nombre,
      datos.apellido,
      datos.dni,
      datos.email,
      datos.telefono,
      datos.fecha_nacimiento,
      rol,
      sede,
      cobertura,
    ];
    if (id) {
      if (rol === "medico") {
        const [usadas] = await conn.query<RowDataPacket[]>(
          "SELECT DISTINCT id_especialidad FROM agenda WHERE id_medico=?",
          [id],
        );
        if (usadas.some((e) => !especialidades.includes(e.id_especialidad)))
          throw new ErrorHttp(
            409,
            "No se puede quitar una especialidad que tiene agenda",
          );
      }
      await conn.query(
        "UPDATE usuario SET nombre=?,apellido=?,dni=?,email=?,telefono=?,fecha_nacimiento=?,rol=?,id_sede=?,id_cobertura=? WHERE id=?",
        [...valores, id],
      );
      if (cuerpo.password)
        await conn.query("UPDATE usuario SET password=? WHERE id=?", [
          await bcrypt.hash(datos.password, 10),
          id,
        ]);
    } else {
      const [r] = await conn.query<ResultSetHeader>(
        "INSERT INTO usuario(nombre,apellido,dni,email,telefono,fecha_nacimiento,rol,id_sede,id_cobertura,password) VALUES(?,?,?,?,?,?,?,?,?,?)",
        [...valores, await bcrypt.hash(datos.password, 10)],
      );
      id = r.insertId;
    }
    await conn.query("DELETE FROM medico_especialidad WHERE id_medico=?", [id]);
    for (const e of especialidades)
      await conn.query(
        "INSERT INTO medico_especialidad(id_medico,id_especialidad) VALUES(?,?)",
        [id, e],
      );
    await conn.commit();
    return await buscarPublicoPorId(id!);
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}

export async function editarPerfil(
  id: number,
  cuerpo: Record<string, unknown>,
) {
  const u = await buscarPublicoPorId(id);
  if (!u) throw new ErrorHttp(404, "Paciente no encontrado");
  const permitidos = ["email", "password", "telefono", "id_cobertura"];
  if (Object.keys(cuerpo).some((k) => !permitidos.includes(k)))
    throw new ErrorHttp(
      400,
      "Solo se puede cambiar email, contraseña, teléfono y cobertura",
    );
  const d = validarRegistro({
    ...u,
    ...cuerpo,
    password: cuerpo.password || "sin-cambio",
  });
  const [duplicados] = await pool.query<RowDataPacket[]>(
    "SELECT id FROM usuario WHERE email=? AND id<>?",
    [d.email, id],
  );
  if (duplicados.length)
    throw new ErrorHttp(409, "El email ya está registrado");
  const [c] = await pool.query<RowDataPacket[]>(
    "SELECT id FROM cobertura WHERE id=?",
    [d.id_cobertura],
  );
  if (!c.length) throw new ErrorHttp(400, "La cobertura no existe");
  const hash = cuerpo.password ? await bcrypt.hash(d.password, 10) : null;
  await pool.query(
    "UPDATE usuario SET email=?,telefono=?,id_cobertura=?,password=COALESCE(?,password) WHERE id=?",
    [d.email, d.telefono, d.id_cobertura, hash, id],
  );
  return buscarPublicoPorId(id);
}

export async function buscarPacientes(texto: string) {
  if (texto.trim().length < 2) return [];
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT u.id,u.nombre,u.apellido,u.dni,u.fecha_nacimiento,u.id_cobertura,c.nombre cobertura FROM usuario u LEFT JOIN cobertura c ON c.id=u.id_cobertura WHERE u.rol='paciente' AND (u.dni LIKE ? OR u.apellido LIKE ?) ORDER BY u.apellido LIMIT 30`,
    [`%${texto}%`, `%${texto}%`],
  );
  return rows;
}
