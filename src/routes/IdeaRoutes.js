import { Router } from "express";
import IdeaController from "../controllers/IdeaController.js";
import { verificarToken } from "../middlewares/auth.js";
import { verificarRol } from "../middlewares/roles.js";

const router = Router();

router.post("/crear", IdeaController.crearIdea);

router.put("/actualizar/:id", IdeaController.actualizarIdea);

router.get("/mis-ideas", IdeaController.listarMisIdeas);

router.get("/:id", IdeaController.obtenerIdea);

router.get("/grupo/listar", IdeaController.listarIdeasGrupo);

export default router;