import { NextFunction, Request, Response } from "express";
import { registrarLog } from "../services/auditoria.service";
import { AccionAuditoria } from "../types";
interface Regla {
  metodo: string;
  patron: RegExp;
  entidad: string;
  accion: AccionAuditoria;
}
const reglas: Regla[] = [];
for (const [ruta, entidad] of [
  ["sedes", "sede"],
  ["especialidades", "especialidad"],
  ["coberturas", "cobertura"],
  ["agendas", "agenda"],
  ["usuarios", "usuario"],
]) {
  reglas.push({
    metodo: "POST",
    patron: new RegExp("^/" + ruta + "$"),
    entidad,
    accion: "ALTA",
  });
  reglas.push({
    metodo: "PUT",
    patron: new RegExp("^/" + ruta + "/(\\d+)$"),
    entidad,
    accion: "MODIFICACION",
  });
  if (ruta !== "usuarios")
    reglas.push({
      metodo: "DELETE",
      patron: new RegExp("^/" + ruta + "/(\\d+)$"),
      entidad,
      accion: "BAJA",
    });
}
reglas.push(
  {
    metodo: "POST",
    patron: /^\/auth\/registro$/,
    entidad: "usuario",
    accion: "ALTA",
  },
  {
    metodo: "POST",
    patron: /^\/pacientes$/,
    entidad: "usuario",
    accion: "ALTA",
  },
  {
    metodo: "PUT",
    patron: /^\/pacientes\/perfil$/,
    entidad: "usuario",
    accion: "MODIFICACION",
  },
  { metodo: "POST", patron: /^\/turnos$/, entidad: "turno", accion: "ALTA" },
  {
    metodo: "PATCH",
    patron: /^\/turnos\/(\d+)\/cancelar$/,
    entidad: "turno",
    accion: "BAJA",
  },
  {
    metodo: "PATCH",
    patron: /^\/turnos\/(\d+)\/atender$/,
    entidad: "turno",
    accion: "MODIFICACION",
  },
);
export function auditar(req: Request, res: Response, next: NextFunction): void {
  const ruta = req.originalUrl.split("?")[0];
  const regla = reglas.find(
    (r) => r.metodo === req.method && r.patron.test(ruta),
  );
  if (!regla) {
    next();
    return;
  }
  const original = res.json.bind(res);
  res.json = (payload: unknown): Response => {
    if (res.statusCode < 200 || res.statusCode >= 300) return original(payload);
    const datos = (payload as { datos?: Record<string, unknown> })?.datos || {};
    const capturado = regla.patron.exec(ruta)?.[1];
    const id = capturado
      ? Number(capturado)
      : typeof datos.id === "number"
        ? datos.id
        : null;
    const actor = req.usuario?.id ?? id;
    if (!actor) return original(payload);
    // Solo usamos campos identificadores; nunca contraseñas ni diagnóstico en el log.
    const fuente = { ...datos, ...req.body };
    const detalle =
      [
        fuente.nombre,
        fuente.apellido,
        fuente.descripcion,
        fuente.fecha,
        fuente.hora,
      ]
        .filter((v) => typeof v === "string")
        .join(" ") || `id ${id ?? actor}`;
    // Esperamos la escritura antes de responder, así el listado ya ve el cambio.
    void registrarLog({
      id_usuario: actor,
      accion: regla.accion,
      entidad: regla.entidad,
      id_entidad: id,
      detalle: `${regla.accion} de ${regla.entidad}: ${detalle}`,
    }).finally(() => original(payload));
    return res;
  };
  next();
}
