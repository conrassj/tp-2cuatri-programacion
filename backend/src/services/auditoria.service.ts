import { RowDataPacket } from "mysql2";
import { pool } from "../database/conexion";
import { EntradaAuditoria, FiltrosAuditoria, LogAuditoria } from "../types";

export async function registrarLog(
  entrada: EntradaAuditoria,
): Promise<boolean> {
  try {
    await pool.query(
      "INSERT INTO log_auditoria(id_usuario,accion,entidad,id_entidad,detalle) VALUES(?,?,?,?,?)",
      [
        entrada.id_usuario,
        entrada.accion,
        entrada.entidad,
        entrada.id_entidad,
        entrada.detalle?.slice(0, 255) || null,
      ],
    );
    return true;
  } catch (e) {
    // El cambio principal ya se hizo. Dejamos aviso del fallo sin fingir que se deshizo.
    console.error(
      "[auditoría] No se pudo guardar el registro de la operación",
      e,
    );
    return false;
  }
}
export async function listarLogs(f: FiltrosAuditoria): Promise<LogAuditoria[]> {
  const condiciones: string[] = [],
    valores: unknown[] = [];
  if (f.id_usuario !== undefined) {
    condiciones.push("l.id_usuario=?");
    valores.push(f.id_usuario);
  }
  if (f.entidad !== undefined) {
    condiciones.push("l.entidad=?");
    valores.push(f.entidad);
  }
  if (f.desde !== undefined) {
    condiciones.push("l.fecha>=?");
    valores.push(f.desde + " 00:00:00");
  }
  if (f.hasta !== undefined) {
    condiciones.push("l.fecha<=?");
    valores.push(f.hasta + " 23:59:59");
  }
  const [r] = await pool.query<RowDataPacket[]>(
    `SELECT l.*,CONCAT(u.apellido,', ',u.nombre) usuario FROM log_auditoria l JOIN usuario u ON u.id=l.id_usuario ${condiciones.length ? "WHERE " + condiciones.join(" AND ") : ""} ORDER BY l.fecha DESC,l.id DESC`,
    valores,
  );
  return r as LogAuditoria[];
}
