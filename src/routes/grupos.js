import { Router } from "express";
import GrupoController from "../controllers/GrupoController.js";

const router = Router();

router.post("/", GrupoController.crearGrupo);
router.patch("/:id_grupo/actualizar-estado", GrupoController.actualizarEstado);
router.get("/generar-clave", GrupoController.generarClaveAcceso);
router.get("/:id_grupo/generar-qr", GrupoController.generarCodigoQR);
router.get("/:id_grupo/clave-y-qr", GrupoController.obtenerClaveYCodigoQR);
router.get("/materia/:id_materia", GrupoController.listarGruposPorMateria);
router.get("/materia/:id_materia/habilitados", GrupoController.listarGruposHabilitadosPorMateria);
router.get("/usuario/:id_usuario", GrupoController.listarGruposPorUsuario);
router.get("/", GrupoController.listarTodosLosGrupos);
router.get("/filtrar", GrupoController.filtrarGrupos);


export default router;