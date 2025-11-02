import { Router } from "express";
import ActividadController from "../controllers/ActividadController.js";
import { verificarToken } from "../middlewares/auth.js";
import { verificarRol } from "../middlewares/roles.js";

const router = Router();

router.post("/", /* verificarToken, verificarRol([2]), */ ActividadController.crearActividad);
router.put("/:id_actividad", /* verificarToken, verificarRol([2]),  */ActividadController.editarActividad);
router.get("/grupo/:codigo_materia/:nombre/:periodo/:anio", ActividadController.verificarActividadGrupo);
export default router;
    