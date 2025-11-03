import Mensaje from "../models/Mensaje.js";
import Notificacion from "../models/Notificacion.js";

async function crearNotificacion(idDestinatario, idMensaje) {
  try {
    const noti = await Notificacion.create({
        id_destinatario: idDestinatario,
        id_mensaje: idMensaje,
        leida: false
    });
    return noti;
  } catch (error) {
    throw new Error("Error al crear la notificacion: " + error.message);
  }
};

async function obetnerNotificacionesUsuario(codigo) {
    if(!codigo){
         throw new Error("El codigo no puede estar vacio");
    }
    try {
        const notificaciones = await Notificacion.findAll({
            where: {id_destinatario: codigo},
            include: [{
                model: Mensaje
            }]
        })
         return notificaciones;
    } catch (error) {
        throw error;
    }
}

export default {crearNotificacion, obetnerNotificacionesUsuario };