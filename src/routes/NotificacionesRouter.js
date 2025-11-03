import { Router } from "express";
import NotificacionController from "../controllers/NotificacionController.js";

const router = Router();

router.get("/listar/:codigo", NotificacionController.obtenerNotificaciones);

export default router;
