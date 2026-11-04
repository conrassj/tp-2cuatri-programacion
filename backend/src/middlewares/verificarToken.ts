import { NextFunction, Request, Response } from "express";
import { ErrorHttp } from "../utils/errorHttp";
import { verificarFirmaToken } from "../utils/jwt";
import { buscarPublicoPorId } from "../services/usuario.service";

export async function verificarToken(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  const partes = req.headers.authorization?.split(" ");
  if (!partes || partes.length !== 2 || partes[0] !== "Bearer" || !partes[1]) {
    next(new ErrorHttp(401, "Falta un token de autenticación válido"));
    return;
  }
  let payload;
  try {
    payload = verificarFirmaToken(partes[1]);
  } catch {
    next(new ErrorHttp(401, "Token inválido o vencido"));
    return;
  }
  try {
    // El rol y la sede se leen de la base: pueden haber cambiado desde el login.
    const actual = await buscarPublicoPorId(payload.id);
    if (!actual) {
      next(new ErrorHttp(401, "El usuario ya no existe"));
      return;
    }
    req.usuario = { id: actual.id, rol: actual.rol, id_sede: actual.id_sede };
    next();
  } catch (e) {
    next(e);
  }
}
