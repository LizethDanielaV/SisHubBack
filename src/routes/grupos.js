import { Router } from "express";
import GrupoController from "../controllers/GrupoController.js";

const router = Router();

router.post("/", GrupoController.crearGrupo);
router.patch("/:id_grupo/deshabilitar", GrupoController.deshabilitarGrupo);
router.get("/generar-clave", GrupoController.generarClaveAcceso);
router.get("/:id_grupo/generar-qr", GrupoController.generarCodigoQR);
router.get("/materia/:id_materia", GrupoController.listarGruposPorMateria);

export default router;