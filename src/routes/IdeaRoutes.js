import { Router } from "express";
import IdeaController from "../controllers/IdeaController.js";
import { verificarToken } from "../middlewares/auth.js";
import { verificarRol } from "../middlewares/roles.js";

const router = Router();


router.post("/crear", verificarToken, IdeaController.crearIdea);
router.get("/grupo/listar", IdeaController.listarIdeasGrupo);
router.get("/libres", IdeaController.listarIdeasLibres);
router.patch("/adoptar/:id_idea", IdeaController.adoptarIdea);
router.put("/actualizar/:id", IdeaController.actualizarIdea);
router.get("/:id", IdeaController.obtenerIdea);
router.put("/:id_idea/revisar", verificarToken, verificarRol([2]), IdeaController.revisarIdea);

export default router;