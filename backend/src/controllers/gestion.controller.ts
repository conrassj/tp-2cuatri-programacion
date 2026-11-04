import { Request, Response, NextFunction } from "express";
import * as usuarios from "../services/gestion-usuarios.service";
import * as disponibilidad from "../services/disponibilidad.service";
import { responder } from "../utils/respuesta";
import { validarIdRuta } from "../validators/comunes";

// Este adaptador deja los errores en el manejador que ya usa el proyecto.
const ejecutar =
  (fn: (req: Request) => Promise<unknown>, codigo = 200) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      responder(res, codigo, "ok", await fn(req));
    } catch (e) {
      next(e);
    }
  };
export const listar = ejecutar((req) => usuarios.listarUsuarios(req.query));
export const crear = ejecutar((req) => usuarios.guardarUsuario(req.body), 201);
export const editar = ejecutar((req) =>
  usuarios.guardarUsuario(req.body, validarIdRuta(req.params.id)),
);
export const perfil = ejecutar((req) =>
  usuarios.editarPerfil(req.usuario!.id, req.body),
);
export const pacientes = ejecutar((req) =>
  usuarios.buscarPacientes(String(req.query.q || "")),
);
export const medicos = ejecutar((req) =>
  disponibilidad.listarMedicos(req.query),
);
export const horarios = ejecutar((req) =>
  disponibilidad.disponibilidad(req.query),
);
