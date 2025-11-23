import express from "express";
import { verificarToken } from "../middlewares/auth.js";
import { verificarRol } from "../middlewares/roles.js";
import {
    obtenerTodosLosUsuarios,
    obtenerUsuariosStandBy,
    cambiarEstadoUsuario,
    aprobarPostulacion,
    rechazarPostulacion,
    cargarDocentesMasivamente,
    buscarEstudiantePorCodigo,
    listarDocentes,
    listarEstudiantes,
    registrarUsuario,
    obtenerUsuarioPorUid, 
    informacionPerfil, 
    descargarPerfilPDF
} from "../controllers/usuarioController.js";

const router = express.Router();

router.post("/register", verificarToken, registrarUsuario);
router.get("/me", verificarToken, obtenerUsuarioPorUid);

router.get("/todos", verificarToken, verificarRol([1]), obtenerTodosLosUsuarios);
router.post("/cargar-docentes", verificarToken, verificarRol([1]), cargarDocentesMasivamente);
router.get("/stand-by", verificarToken, verificarRol([1]), obtenerUsuariosStandBy);
router.patch("/:codigo/estado", verificarToken, verificarRol([1]), cambiarEstadoUsuario);
router.patch("/:codigo/aprobar", verificarToken, verificarRol([1]), aprobarPostulacion);
router.patch("/:codigo/rechazar", verificarToken, verificarRol([1]), rechazarPostulacion);
router.get("/docentes", verificarToken, verificarRol([1]), listarDocentes);
router.get("/estudiantes", /*verificarToken, verificarRol([1]),*/ listarEstudiantes);
router.get("/estudiantes/:codigo", verificarToken, verificarRol([1]), buscarEstudiantePorCodigo);
router.get("/informacion/perfil/:codigo", /*verificarToken, verificarRol([1])*/ informacionPerfil);
router.get("/informacion/perfil/:codigo/pdf", /*verificarToken, verificarRol([1])*/ descargarPerfilPDF);
export default router;