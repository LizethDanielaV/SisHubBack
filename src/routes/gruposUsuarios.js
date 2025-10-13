import { Router } from "express";
import GrupoUsuarioController from "../controllers/GrupoUsuarioController.js";
import { verificarToken } from "../middlewares/auth.js";
import { verificarRol } from "../middlewares/roles.js";

const router = Router();

router.post("/unirse", verificarToken, verificarRol([3]), GrupoUsuarioController.unirseAGrupoPorIdYClave);
router.get("/grupo/participantes", verificarToken, verificarRol([1, 2, 3]), GrupoUsuarioController.listarParticipantesGrupo);

export default router;