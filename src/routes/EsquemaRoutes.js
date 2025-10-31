import { Router } from "express";
import EsquemaController from "../controllers/EsquemaController.js";
import { verificarToken } from "../middlewares/auth.js";
import { verificarRol } from "../middlewares/roles.js";

const router = Router();

router.get("/tipo/:id_tipo_alcance", verificarToken, verificarRol([2]), EsquemaController.listarEsquemasPorTipo);
router.get("/:id_esquema/items", verificarToken, verificarRol([2]), EsquemaController.listarItemsPorEsquema);


export default router;
