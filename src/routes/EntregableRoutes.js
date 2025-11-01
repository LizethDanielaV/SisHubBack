import { Router } from "express";
import EntregableController from "../controllers/EntregableController.js";
import { verificarToken } from "../middlewares/auth.js";
import { verificarRol } from "../middlewares/roles.js";

const router = Router();

router.get("/actividad/:id_actividad", verificarToken, verificarRol([1, 2]), EntregableController.listarEntregablesPorActividad);
router.put(
    "/retroalimentar/:id_entregable",
    //   verificarToken,verificarRol([1, 2]), 
    EntregableController.retroalimentarEntregable
);

export default router;
