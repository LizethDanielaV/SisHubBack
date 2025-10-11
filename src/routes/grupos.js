import { Router } from "express";
import GrupoController from "../controllers/GrupoController.js";

const router = Router();

router.post("/", GrupoController.crearGrupo);
router.patch("/actualizar-estado", GrupoController.actualizarEstado);
router.get("/generar-clave", GrupoController.generarClaveAcceso);
router.get("/:codigo_materia/:nombre/:periodo/:anio/generar-qr", GrupoController.generarCodigoQR);
router.get("/clave-y-qr", GrupoController.obtenerClaveYCodigoQR);
router.get("/materia/:codigo_materia", GrupoController.listarGruposPorMateria);
router.get("/materia/:codigo_materia/habilitados", GrupoController.listarGruposHabilitadosPorMateria);
router.get("/usuario/:codigo_usuario", GrupoController.listarGruposPorUsuario);
router.get("/", GrupoController.listarTodosLosGrupos);
router.get("/filtrar", GrupoController.filtrarGrupos);


export default router;