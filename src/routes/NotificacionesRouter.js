import { Router } from "express";
import NotificacionController from "../controllers/NotificacionController.js";

const router = Router();

router.get("/listar/:codigo", NotificacionController.obtenerNotificaciones);
router.patch("/cambiarEstado/:id_notificacion", NotificacionController.cambiarEstado);

export default router;
