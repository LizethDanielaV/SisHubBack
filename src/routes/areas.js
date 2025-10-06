import express from "express";
import { verificarToken } from "../middlewares/auth.js";
import { verificarRol } from "../middlewares/roles.js";
import { crearArea, listar } from "../controllers/areaController.js";

const router = express.Router();

router.post("/crear", verificarToken, verificarRol([1]), crearArea);
router.get("/listar", verificarToken, verificarRol([1, 2, 3]), listar );

export default router;