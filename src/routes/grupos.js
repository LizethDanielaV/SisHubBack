import { Router } from "express";
import GrupoController from "../controllers/GrupoController.js";
import { verificarToken } from "../middlewares/auth.js";
import { verificarRol } from "../middlewares/roles.js";
import multer from "multer";
const router = Router();


const upload = multer({ dest: "uploads/" });

router.post("/", verificarToken, verificarRol([1]), GrupoController.crearGrupo);
router.patch("/actualizar-estado", verificarToken, verificarRol([1, 2]), GrupoController.actualizarEstado);
router.get("/generar-clave", verificarToken, verificarRol([1, 2]), GrupoController.generarClaveAcceso);
router.get("/:codigo_materia/:nombre/:periodo/:anio/generar-qr", verificarToken, verificarRol([1, 2]), GrupoController.generarCodigoQR);
router.post("/clave-y-qr", verificarToken, verificarRol([1, 2]), GrupoController.obtenerClaveYCodigoQR);
router.patch("/actualizar-clave", verificarToken, verificarRol([1, 2]), GrupoController.actualizarClaveAcceso);
router.get("/materia/:codigo_materia", verificarToken, verificarRol([1, 2, 3]), GrupoController.listarGruposPorMateria);
router.get("/materia/:codigo_materia/habilitados", verificarToken, verificarRol([1, 2, 3]), GrupoController.listarGruposHabilitadosPorMateria);
router.get("/usuario/:codigo_usuario", verificarToken, verificarRol([1, 2, 3]), GrupoController.listarGruposPorUsuario);
router.get("/", verificarToken,  verificarRol([1, 2, 3]), GrupoController.listarTodosLosGrupos);
router.get("/filtrar", verificarToken, verificarRol([1, 2, 3]), GrupoController.filtrarGrupos);
router.post("/cargar-csv", verificarToken, verificarRol([1]), upload.single("file"), GrupoController.cargarGruposDesdeCSV);

export default router;