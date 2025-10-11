import express from "express";
import { verificarToken } from "../middlewares/auth.js";
import { verificarRol } from "../middlewares/roles.js";
import {
    obtenerTodosLosUsuarios,
    obtenerUsuariosStandBy,
    cambiarEstadoUsuario,
    aprobarPostulacion,
    rechazarPostulacion
} from "../controllers/usuarioController.js";
import { registrarUsuario, obtenerUsuarioPorUid, listarDocentes } from "../controllers/usuarioController.js";

const router = express.Router();

router.post("/register", verificarToken, registrarUsuario);
router.get("/me", verificarToken, obtenerUsuarioPorUid);

router.get("/todos", verificarToken, verificarRol([1]),obtenerTodosLosUsuarios);
router.get("/stand-by", verificarToken, verificarRol([1]), obtenerUsuariosStandBy);
router.patch("/:codigo/estado", verificarToken, verificarRol([1]), cambiarEstadoUsuario);
router.patch("/:codigo/aprobar", verificarToken, verificarRol([1]), aprobarPostulacion);
router.patch("/:codigo/rechazar", verificarToken, verificarRol([1]), rechazarPostulacion);
router.get("/docentes", listarDocentes);

export default router;