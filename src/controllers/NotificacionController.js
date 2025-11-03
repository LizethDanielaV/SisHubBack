import NotificacionService from "../services/NotificacionService.js";

async function obtenerNotificaciones(req, res) {
  try {
    const notificaciones =
      await NotificacionService.obetnerNotificacionesUsuario(
        req.params.codigo
      );
    res.status(200).json(notificaciones);
  } catch (error) {
    res.status(error.statusCode || 500).json({
      message: error.message || "Error interno del servidor",
    });
  }
};

export default {obtenerNotificaciones };