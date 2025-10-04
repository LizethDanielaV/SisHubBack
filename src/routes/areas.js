import express from "express";
import { verificarToken } from "../middlewares/auth.js";
import { verificarRol } from "../middlewares/roles.js";
import { crearArea } from "../controllers/areaController.js";

const router = express.Router();

router.post("/crear", verificarToken, verificarRol([1]), crearArea);

export default router;