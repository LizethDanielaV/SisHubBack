import { Router } from "express";
import MateriaController from "../controllers/MateriaController.js";
import { verificarToken } from "../middlewares/auth.js";
import { verificarRol } from "../middlewares/roles.js";

const router = Router();

router.post("/",verificarToken, verificarRol([1]), MateriaController.crear);
router.put("/:id_materia", verificarToken, verificarRol([1]), MateriaController.actualizar);
router.get("/", verificarToken, verificarRol([1, 2, 3]), MateriaController.listar);
router.get("/:id_materia", verificarToken, verificarRol([1, 2, 3]), MateriaController.buscarPorId);
export default router;
