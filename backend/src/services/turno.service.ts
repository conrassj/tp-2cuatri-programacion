import { RowDataPacket, ResultSetHeader } from "mysql2";
import { PoolConnection } from "mysql2/promise";
import { pool } from "../database/conexion";
import { DatosNuevoTurno, DatosHistorial, Turno } from "../types";
import { ErrorHttp } from "../utils/errorHttp";
import { DURACION_TURNO, minutos, esFuturo } from "./disponibilidad.service";

const SELECT_TURNO = `SELECT t.*,a.id_medico,a.id_sede,a.id_especialidad,
 CONCAT(m.apellido,', ',m.nombre) medico,CONCAT(p.apellido,', ',p.nombre) paciente,
 p.fecha_nacimiento,e.descripcion especialidad,s.nombre sede,
 h.diagnostico,h.tratamiento,h.observaciones
 FROM turno t JOIN agenda a ON a.id=t.id_agenda
 JOIN usuario m ON m.id=a.id_medico JOIN usuario p ON p.id=t.id_paciente
 JOIN especialidad e ON e.id=a.id_especialidad JOIN sede s ON s.id=a.id_sede
 LEFT JOIN historial_clinico h ON h.id_turno=t.id`;

async function notificar(
  c: PoolConnection,
  id: number,
  tipo: string,
  mensaje: string,
) {
  await c.query(
    "INSERT INTO notificacion(id_usuario,tipo,mensaje,leida) VALUES(?,?,?,0)",
    [id, tipo, mensaje],
  );
}
export async function crearTurno(
  d: DatosNuevoTurno,
  idPaciente: number,
): Promise<number> {
  if (!esFuturo(d.fecha, d.hora))
    throw new ErrorHttp(400, "Elegí un horario futuro");
  const c = await pool.getConnection();
  try {
    await c.beginTransaction();
    // Bloqueamos la agenda: dos pedidos al mismo horario se revisan uno después del otro.
    const [agendas] = await c.query<RowDataPacket[]>(
      "SELECT * FROM agenda WHERE id_medico=? AND id_especialidad=? AND id_sede=? AND fecha=? AND hora_entrada<=? AND hora_salida>? FOR UPDATE",
      [d.id_medico, d.id_especialidad, d.id_sede, d.fecha, d.hora, d.hora],
    );
    const a = agendas[0];
    if (
      !a ||
      minutos(d.hora) + DURACION_TURNO > minutos(a.hora_salida) ||
      (minutos(d.hora) - minutos(a.hora_entrada)) % DURACION_TURNO !== 0
    )
      throw new ErrorHttp(
        400,
        "El horario no corresponde a un turno disponible de 30 minutos",
      );
    const [ocupados] = await c.query<RowDataPacket[]>(
      "SELECT hora FROM turno WHERE id_agenda=? AND estado<>'cancelado' FOR UPDATE",
      [a.id],
    );
    if (
      ocupados.some(
        (t) => Math.abs(minutos(t.hora) - minutos(d.hora)) < DURACION_TURNO,
      )
    )
      throw new ErrorHttp(
        409,
        "Ese horario ya se ocupó. Elegí otro horario disponible",
      );
    const [pacientes] = await c.query<RowDataPacket[]>(
      "SELECT id_cobertura FROM usuario WHERE id=? AND rol='paciente'",
      [idPaciente],
    );
    if (!pacientes[0]?.id_cobertura)
      throw new ErrorHttp(400, "El paciente no tiene cobertura registrada");
    const [r] = await c.query<ResultSetHeader>(
      "INSERT INTO turno(nota,id_agenda,fecha,hora,id_paciente,id_cobertura,estado) VALUES(?,?,?,?,?,?,'confirmado')",
      [d.nota, a.id, d.fecha, d.hora, idPaciente, pacientes[0].id_cobertura],
    );
    await notificar(
      c,
      idPaciente,
      "turno_confirmado",
      `Tu turno del ${d.fecha} a las ${d.hora} fue confirmado`,
    );
    await notificar(
      c,
      d.id_medico,
      "turno_confirmado",
      `Tenés un turno nuevo el ${d.fecha} a las ${d.hora}`,
    );
    await c.commit();
    return r.insertId;
  } catch (e) {
    await c.rollback();
    throw e;
  } finally {
    c.release();
  }
}
export async function buscarTurnoPorId(id: number): Promise<Turno> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `${SELECT_TURNO} WHERE t.id=?`,
    [id],
  );
  if (!rows.length) throw new ErrorHttp(404, "Turno no encontrado");
  return rows[0] as Turno;
}
async function cambiarEstado(
  id: number,
  idUsuario: number,
  rol: string,
  idSede: number | null,
  estado: string,
  historial?: DatosHistorial,
) {
  const c = await pool.getConnection();
  try {
    await c.beginTransaction();
    const [rows] = await c.query<RowDataPacket[]>(
      "SELECT t.*,a.id_medico,a.id_sede FROM turno t JOIN agenda a ON a.id=t.id_agenda WHERE t.id=? FOR UPDATE",
      [id],
    );
    const t = rows[0];
    if (!t) throw new ErrorHttp(404, "Turno no encontrado");
    if (
      (rol === "paciente" && t.id_paciente !== idUsuario) ||
      (rol === "medico" && t.id_medico !== idUsuario) ||
      (rol === "operador" && t.id_sede !== idSede)
    )
      throw new ErrorHttp(403, "No tenés permiso para modificar este turno");
    if (t.estado !== "confirmado")
      throw new ErrorHttp(
        409,
        "El turno ya no está confirmado. Actualizá el listado",
      );
    if (estado === "atendido" && rol !== "medico")
      throw new ErrorHttp(403, "Solo el médico puede atender el turno");
    await c.query("UPDATE turno SET estado=? WHERE id=?", [estado, id]);
    if (historial)
      await c.query(
        "INSERT INTO historial_clinico(id_turno,id_medico,id_paciente,diagnostico,tratamiento,observaciones) VALUES(?,?,?,?,?,?)",
        [
          id,
          idUsuario,
          t.id_paciente,
          historial.diagnostico,
          historial.tratamiento || null,
          historial.observaciones || null,
        ],
      );
    await notificar(
      c,
      t.id_paciente,
      `turno_${estado}`,
      `Tu turno del ${t.fecha} a las ${t.hora} fue ${estado}`,
    );
    await notificar(
      c,
      t.id_medico,
      `turno_${estado}`,
      `El turno del ${t.fecha} a las ${t.hora} fue ${estado}`,
    );
    await c.commit();
  } catch (e) {
    await c.rollback();
    throw e;
  } finally {
    c.release();
  }
}
export async function cancelarTurno(
  id: number,
  usuario: number,
  rol: string,
  sede: number | null,
) {
  await cambiarEstado(id, usuario, rol, sede, "cancelado");
}
export async function atenderTurno(
  id: number,
  medico: number,
  sede: number | null,
  historial?: DatosHistorial,
) {
  await cambiarEstado(id, medico, "medico", sede, "atendido", historial);
}
export async function listarTurnosPaciente(id: number): Promise<Turno[]> {
  const [r] = await pool.query<RowDataPacket[]>(
    `${SELECT_TURNO} WHERE t.id_paciente=? ORDER BY CASE WHEN TIMESTAMP(t.fecha,t.hora)>=NOW() THEN 0 ELSE 1 END, CASE WHEN TIMESTAMP(t.fecha,t.hora)>=NOW() THEN TIMESTAMP(t.fecha,t.hora) END ASC, CASE WHEN TIMESTAMP(t.fecha,t.hora)<NOW() THEN TIMESTAMP(t.fecha,t.hora) END DESC, t.id`,
    [id],
  );
  return r as Turno[];
}
export async function listarTurnosMedico(
  id: number,
  fecha: string,
): Promise<Turno[]> {
  const [r] = await pool.query<RowDataPacket[]>(
    `${SELECT_TURNO} WHERE a.id_medico=? AND t.fecha=? ORDER BY t.hora,t.id`,
    [id, fecha],
  );
  return r as Turno[];
}
export async function listarTurnosSede(
  id: number,
  fecha: string,
): Promise<Turno[]> {
  const [r] = await pool.query<RowDataPacket[]>(
    `${SELECT_TURNO} WHERE a.id_sede=? AND t.fecha=? ORDER BY t.hora,t.id`,
    [id, fecha],
  );
  return r as Turno[];
}
