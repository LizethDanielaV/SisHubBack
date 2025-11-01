import { Router } from "express";
import ProyectoController from "../controllers/ProyectoController.js";
import { verificarToken } from "../middlewares/auth.js";
import { verificarRol } from "../middlewares/roles.js";

const router = Router();

router.post("/crear/:id", verificarToken, ProyectoController.crearProyectoDesdeIdea);
router.get("/:id", /* verificarToken, */ ProyectoController.obtenerProyecto);
router.patch("/:id", /* verificarToken,  */ProyectoController.actualizarProyecto);
router.get("/listar/paraDirector", /* verificarToken, */ ProyectoController.listarParaDirector);

export default router;