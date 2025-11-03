import Mensaje from "../models/Mensaje.js";

async function crearMensaje(titulo, mensaje, remitente) {
  try {
    const mensajeNuevo = await Mensaje.create({
        titulo: titulo, 
        mensaje: mensaje,
        remitente: remitente
    });
    return mensajeNuevo;
  } catch (error) {
    console.error("Error interno al crear mensaje:", error);
    throw new Error("Error al crear el mensaje: " + error.message);
  }
}

export default {crearMensaje}