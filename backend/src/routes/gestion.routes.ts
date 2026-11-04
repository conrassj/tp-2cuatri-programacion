import { Router } from "express";
import { verificarToken } from "../middlewares/verificarToken";
import { verificarRol } from "../middlewares/verificarRol";
import * as c from "../controllers/gestion.controller";
import { registro } from "../controllers/auth.controller";
export const rutasGestion = Router();
rutasGestion.use(verificarToken);
rutasGestion.get("/medicos", c.medicos);
rutasGestion.get(
  "/disponibilidad",
  verificarRol("paciente", "operador"),
  c.horarios,
);
rutasGestion.get(
  "/pacientes",
  verificarRol("medico", "operador", "admin"),
  c.pacientes,
);
rutasGestion.post("/pacientes", verificarRol("operador"), registro);
rutasGestion.put("/pacientes/perfil", verificarRol("paciente"), c.perfil);
rutasGestion.get("/usuarios", verificarRol("admin"), c.listar);
rutasGestion.post("/usuarios", verificarRol("admin"), c.crear);
rutasGestion.put("/usuarios/:id", verificarRol("admin"), c.editar);
