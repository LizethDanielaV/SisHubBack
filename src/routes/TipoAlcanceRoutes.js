import { Router } from "express";
import TipoAlcanceController from "../controllers/TipoAlcanceController.js";
import { verificarToken } from "../middlewares/auth.js";
import { verificarRol } from "../middlewares/roles.js";

const router = Router();


// router.get("/", verificarToken, verificarRol([2]), TipoAlcanceController.listarTiposAlcance);
router.get("/", TipoAlcanceController.listarTiposAlcance);


export default router;
