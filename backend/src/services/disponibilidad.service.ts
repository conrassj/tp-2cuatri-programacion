import { RowDataPacket } from "mysql2";
import { pool } from "../database/conexion";
import { ErrorHttp } from "../utils/errorHttp";
import { esFechaValida } from "../validators/comunes";
export const DURACION_TURNO = 30;
export const minutos = (hora: string) =>
  Number(hora.slice(0, 2)) * 60 + Number(hora.slice(3, 5));
export const horaTexto = (m: number) =>
  `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
export function esFuturo(fecha: string, hora: string) {
  return new Date(`${fecha}T${hora}:00`).getTime() > Date.now();
}

export async function listarMedicos(q: Record<string, unknown>) {
  const condiciones = ["u.rol='medico'"],
    params: unknown[] = [];
  if (q.id_especialidad) {
    condiciones.push(
      "EXISTS (SELECT 1 FROM medico_especialidad me WHERE me.id_medico=u.id AND me.id_especialidad=?)",
    );
    params.push(q.id_especialidad);
  }
  if (q.id_sede) {
    condiciones.push(
      "EXISTS (SELECT 1 FROM agenda a WHERE a.id_medico=u.id AND a.id_sede=?)",
    );
    params.push(q.id_sede);
  }
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT u.id,u.nombre,u.apellido FROM usuario u WHERE ${condiciones.join(" AND ")} ORDER BY u.apellido`,
    params,
  );
  for (const u of rows) {
    const [e] = await pool.query<RowDataPacket[]>(
      "SELECT e.id,e.descripcion FROM especialidad e JOIN medico_especialidad me ON me.id_especialidad=e.id WHERE me.id_medico=?",
      [u.id],
    );
    u.especialidades = e;
  }
  return rows;
}
export async function disponibilidad(q: Record<string, unknown>) {
  const ids = ["id_medico", "id_especialidad", "id_sede"].map((k) =>
    Number(q[k]),
  );
  if (ids.some((n) => !Number.isInteger(n) || n <= 0))
    throw new ErrorHttp(400, "Elegí médico, especialidad y sede");
  if (q.fecha && !esFechaValida(String(q.fecha)))
    throw new ErrorHttp(400, "Fecha inválida");
  const [agendas] = await pool.query<RowDataPacket[]>(
    `SELECT * FROM agenda WHERE id_medico=? AND id_especialidad=? AND id_sede=? AND fecha>=CURDATE() ${q.fecha ? "AND fecha=?" : ""} ORDER BY fecha,hora_entrada`,
    q.fecha ? [...ids, q.fecha] : ids,
  );
  const horarios: { fecha: string; hora: string; id_agenda: number }[] = [];
  for (const a of agendas) {
    const [ocupados] = await pool.query<RowDataPacket[]>(
      "SELECT hora FROM turno WHERE id_agenda=? AND estado<>'cancelado'",
      [a.id],
    );
    for (
      let m = minutos(a.hora_entrada);
      m + DURACION_TURNO <= minutos(a.hora_salida);
      m += DURACION_TURNO
    ) {
      const hora = horaTexto(m);
      if (
        esFuturo(a.fecha, hora) &&
        !ocupados.some((t) => Math.abs(minutos(t.hora) - m) < DURACION_TURNO)
      )
        horarios.push({ fecha: a.fecha, hora, id_agenda: a.id });
    }
  }
  return {
    fechas: [...new Set(horarios.map((h) => h.fecha))],
    horarios: q.fecha ? horarios : [],
    duracion: DURACION_TURNO,
  };
}
