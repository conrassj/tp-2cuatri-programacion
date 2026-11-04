import { RowDataPacket, ResultSetHeader } from "mysql2";
import { PoolConnection } from "mysql2/promise";
import { pool } from "../database/conexion";
import {
  AgendaDetallada,
  DatosAgenda,
  FiltrosAgenda,
  PayloadJWT,
} from "../types";
import { ErrorHttp } from "../utils/errorHttp";
import { minutos } from "./disponibilidad.service";

const SELECT_AGENDA = `SELECT a.*,CONCAT(u.apellido,', ',u.nombre) medico,e.descripcion especialidad,s.nombre sede,
 (SELECT COUNT(*) FROM turno t WHERE t.id_agenda=a.id AND t.estado='confirmado') turnos_confirmados
 FROM agenda a JOIN usuario u ON u.id=a.id_medico JOIN especialidad e ON e.id=a.id_especialidad JOIN sede s ON s.id=a.id_sede`;

export async function listarAgendas(
  f: FiltrosAgenda,
  u: PayloadJWT,
): Promise<AgendaDetallada[]> {
  const condiciones: string[] = [],
    valores: unknown[] = [];
  const filtros = { ...f, ...(u.rol === "medico" ? { id_medico: u.id } : {}) };
  for (const clave of ["id_medico", "id_sede", "fecha"] as const)
    if (filtros[clave] !== undefined) {
      condiciones.push(`a.${clave}=?`);
      valores.push(filtros[clave]);
    }
  const [r] = await pool.query<RowDataPacket[]>(
    `${SELECT_AGENDA}${condiciones.length ? " WHERE " + condiciones.join(" AND ") : ""} ORDER BY a.fecha,a.hora_entrada`,
    valores,
  );
  return r as AgendaDetallada[];
}
function permiso(a: { id_medico: number; id_sede: number }, u: PayloadJWT) {
  if (u.rol === "medico" && a.id_medico !== u.id)
    throw new ErrorHttp(403, "Solo podés gestionar tu propia agenda");
  if (u.rol === "operador" && a.id_sede !== u.id_sede)
    throw new ErrorHttp(403, "Solo podés modificar la agenda de tu sede");
}
async function referencias(c: PoolConnection, d: DatosAgenda) {
  const [m] = await c.query<RowDataPacket[]>(
    "SELECT id FROM usuario WHERE id=? AND rol='medico' FOR UPDATE",
    [d.id_medico],
  );
  if (!m.length) throw new ErrorHttp(400, "El médico no existe");
  const [e] = await c.query<RowDataPacket[]>(
    "SELECT id FROM medico_especialidad WHERE id_medico=? AND id_especialidad=?",
    [d.id_medico, d.id_especialidad],
  );
  if (!e.length)
    throw new ErrorHttp(400, "El médico no tiene esa especialidad");
  const [s] = await c.query<RowDataPacket[]>("SELECT id FROM sede WHERE id=?", [
    d.id_sede,
  ]);
  if (!s.length) throw new ErrorHttp(400, "La sede no existe");
}
async function guardar(
  d: DatosAgenda,
  u: PayloadJWT,
  id?: number,
): Promise<AgendaDetallada> {
  permiso(d, u);
  if (minutos(d.hora_salida) - minutos(d.hora_entrada) < 30)
    throw new ErrorHttp(
      400,
      "La agenda debe permitir al menos un turno de 30 minutos",
    );
  const c = await pool.getConnection();
  try {
    await c.beginTransaction();
    // El bloqueo del médico evita que dos altas simultáneas creen rangos superpuestos.
    await referencias(c, d);
    if (id) {
      const [r] = await c.query<RowDataPacket[]>(
        "SELECT * FROM agenda WHERE id=? FOR UPDATE",
        [id],
      );
      const anterior = r[0];
      if (!anterior) throw new ErrorHttp(404, "La agenda no existe");
      permiso({ id_medico: anterior.id_medico, id_sede: anterior.id_sede }, u);
      if (d.id_medico !== anterior.id_medico)
        throw new ErrorHttp(
          400,
          "La agenda no se puede reasignar a otro médico",
        );
      // Conservamos también las atenciones pasadas para no cambiar su historia.
      const [turnos] = await c.query<RowDataPacket[]>(
        "SELECT hora FROM turno WHERE id_agenda=? AND estado<>'cancelado' FOR UPDATE",
        [id],
      );
      if (
        turnos.length &&
        (d.fecha !== anterior.fecha ||
          d.id_sede !== anterior.id_sede ||
          d.id_especialidad !== anterior.id_especialidad ||
          turnos.some(
            (t) =>
              t.hora < d.hora_entrada ||
              minutos(t.hora) + 30 > minutos(d.hora_salida) ||
              (minutos(t.hora) - minutos(d.hora_entrada)) % 30 !== 0,
          ))
      )
        throw new ErrorHttp(
          409,
          "El cambio dejaría turnos fuera de su horario o cambiaría sus datos. Conservá los turnos asociados.",
        );
    }
    const [solapados] = await c.query<RowDataPacket[]>(
      "SELECT id FROM agenda WHERE id_medico=? AND fecha=? AND hora_entrada<? AND hora_salida>? AND id<>?",
      [d.id_medico, d.fecha, d.hora_salida, d.hora_entrada, id || 0],
    );
    if (solapados.length)
      throw new ErrorHttp(
        409,
        "El médico ya tiene una agenda que se superpone con ese horario",
      );
    const valores = [
      d.hora_entrada,
      d.hora_salida,
      d.fecha,
      d.id_medico,
      d.id_especialidad,
      d.id_sede,
    ];
    if (id)
      await c.query(
        "UPDATE agenda SET hora_entrada=?,hora_salida=?,fecha=?,id_medico=?,id_especialidad=?,id_sede=? WHERE id=?",
        [...valores, id],
      );
    else {
      const [r] = await c.query<ResultSetHeader>(
        "INSERT INTO agenda(hora_entrada,hora_salida,fecha,id_medico,id_especialidad,id_sede) VALUES(?,?,?,?,?,?)",
        valores,
      );
      id = r.insertId;
    }
    const [resultado] = await c.query<RowDataPacket[]>(
      `${SELECT_AGENDA} WHERE a.id=?`,
      [id],
    );
    await c.commit();
    return resultado[0] as AgendaDetallada;
  } catch (e) {
    await c.rollback();
    throw e;
  } finally {
    c.release();
  }
}
export async function crearAgenda(d: DatosAgenda, u: PayloadJWT) {
  return guardar(d, u);
}
export async function actualizarAgenda(
  id: number,
  d: DatosAgenda,
  u: PayloadJWT,
) {
  return guardar(d, u, id);
}
export async function eliminarAgenda(id: number, u: PayloadJWT): Promise<void> {
  const c = await pool.getConnection();
  try {
    await c.beginTransaction();
    const [rows] = await c.query<RowDataPacket[]>(
      "SELECT * FROM agenda WHERE id=? FOR UPDATE",
      [id],
    );
    const a = rows[0];
    if (!a) throw new ErrorHttp(404, "La agenda no existe");
    permiso({ id_medico: a.id_medico, id_sede: a.id_sede }, u);
    const [t] = await c.query<RowDataPacket[]>(
      "SELECT id FROM turno WHERE id_agenda=? FOR UPDATE",
      [id],
    );
    if (t.length)
      throw new ErrorHttp(
        409,
        "No se puede eliminar una agenda con turnos asociados, para conservar su historial",
      );
    await c.query("DELETE FROM agenda WHERE id=?", [id]);
    await c.commit();
  } catch (e) {
    await c.rollback();
    throw e;
  } finally {
    c.release();
  }
}
