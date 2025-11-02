import { Router } from "express";
import IdeaController from "../controllers/IdeaController.js";
import { verificarToken } from "../middlewares/auth.js";
import { verificarRol } from "../middlewares/roles.js";

const router = Router();


router.post("/crear", /* verificarToken,  */IdeaController.crearIdea);
router.post("/verificar/:codigo_usuario", IdeaController.verificarIdeaYProyecto);
router.get("/grupo/listar", IdeaController.listarIdeasGrupo);
router.get("/libres", IdeaController.listarIdeasLibres);
router.get("/:id_idea/ultimo-historial", IdeaController.obtenerUltimoHistorial);
router.patch("/adoptar/:id_idea", IdeaController.adoptarIdea);
router.put("/actualizar/:id", IdeaController.actualizarIdea);
router.get("/:id", IdeaController.obtenerIdea);
router.put("/:id_idea/revisar"/* , verificarToken, verificarRol([1, 2]) */, IdeaController.revisarIdea);
router.put("/:id_idea/no-corregir"/* , verificarToken, verificarRol([3]) */, IdeaController.moverIdeaAlBancoPorDecision);
export default router;