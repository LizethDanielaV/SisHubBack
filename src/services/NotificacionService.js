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

async function cambiarEstado(idNotificacion) {
    if(!idNotificacion){
        throw new Error("el codigo es vacío");
    }
    try {
        const nofiUsuario = await Notificacion.findByPk(idNotificacion);
        if(!nofiUsuario){
            throw new Error("No se encontró la notificacion del usuario");
        }
        nofiUsuario.leida = !nofiUsuario.leida;
        await nofiUsuario.save({field:['leida'] });
        return nofiUsuario;
    } catch (error) {
        throw error;
    }
}

export default {crearNotificacion, obetnerNotificacionesUsuario, cambiarEstado };