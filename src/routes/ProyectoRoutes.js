import { Router } from "express";
import ProyectoController from "../controllers/ProyectoController.js";
import { verificarToken } from "../middlewares/auth.js";
import { verificarRol } from "../middlewares/roles.js";

const router = Router();

/*router.get("/grupo/listar", verificarToken, ProyectoController.listarProyectosPorGrupo);*/
router.post("/crear/:id", verificarToken, ProyectoController.crearProyectoDesdeIdea);
router.get("/:id", /* verificarToken, */ ProyectoController.obtenerProyecto);
router.patch("/:id", /* verificarToken,  */ProyectoController.actualizarProyecto);
router.get("/listar/paraDirector", /* verificarToken, */ ProyectoController.listarParaDirector);
router.get("/listar/paraEstudiante/:codigo_estudiante", ProyectoController.listarTodosProyectosDeUnEstudiante);
router.get("/listar/paraDocente/:codigo_docente", ProyectoController.listarTodosProyectosDeUnProfesor);
router.get("/listar/porGrupo", ProyectoController.listarTodosProyectosDeUnGrupo);

export default router;