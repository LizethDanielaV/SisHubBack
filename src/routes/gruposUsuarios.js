import { Router } from "express";
import GrupoUsuarioController from "../controllers/GrupoUsuarioController.js";

const router = Router();

router.post("/unirse", GrupoUsuarioController.unirseAGrupoPorNombreYClave);

export default router;