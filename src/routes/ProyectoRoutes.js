import { Router } from "express";
import ProyectoController from "../controllers/ProyectoController.js";
import { verificarToken } from "../middlewares/auth.js";
import { verificarRol } from "../middlewares/roles.js";

const router = Router();


/*router.get("/grupo/listar", verificarToken, ProyectoController.listarProyectosPorGrupo);*/
router.get("/libres", ProyectoController.listarPropuestasLibres);
router.get("/listar/paraDirector", /* verificarToken, */ ProyectoController.listarParaDirector);
router.get("/listar/porGrupo", ProyectoController.listarTodosProyectosDeUnGrupo);
router.get("/:id", /* verificarToken, */ ProyectoController.obtenerProyecto);
router.get("/continuables/:codigo_usuario", ProyectoController.obtenerProyectosContinuables);
router.get("/listar/paraEstudiante/:codigo_estudiante", ProyectoController.listarTodosProyectosDeUnEstudiante);
router.get("/listar/paraDocente/:codigo_docente", ProyectoController.listarTodosProyectosDeUnProfesor);
router.put("/revisar", /* verificarToken, verificarRol([2]), */ ProyectoController.revisarProyecto);
router.post("/crear/:id", verificarToken, ProyectoController.crearProyectoDesdeIdea);
router.patch("/:id", /* verificarToken,  */ProyectoController.actualizarProyecto);
router.post("/:id_proyecto/calificar", ProyectoController.calificarProyecto);
router.post("/:id_proyecto/continuar", ProyectoController.continuarProyecto);
router.patch("/liberar/:idProyecto", ProyectoController.liberarProyecto);
router.patch("/adoptar/:id_proyecto", ProyectoController.adoptarPropuesta);
router.post("/crear/:id", /* verificarToken,  */ProyectoController.crearProyectoDesdeIdea);
router.get("/:id", /* verificarToken, */ ProyectoController.obtenerProyecto);
router.patch("/:id", /* verificarToken,  */ProyectoController.actualizarProyecto);
router.get("/verDetalle/:id_proyecto", ProyectoController.verDetalleProyecto);
router.get("/historial/:id_proyecto", ProyectoController.generarHistorialProyecto);
router.get("/avance/:id_proyecto", ProyectoController.calcularAvanceProyecto);
export default router;