import express from "express";
import { verificarToken } from "../middlewares/auth.js";
import { registrarUsuario } from "../controllers/usuarioController.js";

const router = express.Router();

router.post("/register", verificarToken, registrarUsuario);

export default router;