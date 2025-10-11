import { Router } from "express";
import GrupoUsuarioController from "../controllers/GrupoUsuarioController.js";

const router = Router();

router.post("/unirse", GrupoUsuarioController.unirseAGrupoPorIdYClave);
router.get("/grupo/participantes", GrupoUsuarioController.listarParticipantesGrupo);

export default router;