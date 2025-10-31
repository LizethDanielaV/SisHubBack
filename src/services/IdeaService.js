import Idea from "../models/Idea.js";
import HistorialIdea from "../models/HistorialIdea.js";
import Estado from "../models/Estado.js";

async function revisarIdea(id_idea, accion, observacion, codigo_usuario) {
  try {
    const idea = await Idea.findByPk(id_idea);

    if (!idea) throw new Error("Idea no encontrada");

    // Validar acción permitida
    const accionesValidas = ["Aprobar", "Aprobar_Con_Observacion", "Rechazar"];
    if (!accionesValidas.includes(accion)) {
      throw new Error("Acción no válida. Use: Aprobar, Aprobar_Con_Observacion o Rechazar");
    }

    // Cambiar estado según la acción
    let nuevoEstado;
    let mensaje;

    switch (accion) {
      case "Aprobar":
        nuevoEstado = await Estado.findOne({ where: { descripcion: "APROBADO" } });
        mensaje = "Idea aprobada sin observaciones.";
        break;

      case "Aprobar_Con_Observacion":
        nuevoEstado = await Estado.findOne({ where: { descripcion: "STAND_BY" } });
        mensaje = "Idea aprobada con observaciones. En espera de corrección del estudiante.";
        break;

      case "Rechazar":
        nuevoEstado = await Estado.findOne({ where: { descripcion: "RECHAZADO" } });
        mensaje = "Idea rechazada. El estudiante deberá crear una nueva propuesta.";
        break;
    }

    if (!nuevoEstado) throw new Error("No se encontró el estado correspondiente.");

    // Actualizar la idea
    idea.id_estado = nuevoEstado.id_estado;
    await idea.save();

    // Registrar en historial
    const textoObservacion = observacion
      ? `${mensaje} Observaciones: ${observacion}`
      : mensaje;

    await HistorialIdea.create({
      fecha: new Date(),
      observacion: textoObservacion,
      id_estado: nuevoEstado.id_estado,
      id_idea,
      codigo_usuario
    });

    return { message: mensaje, idea };
  } catch (error) {
    throw new Error("Error al revisar la idea: " + error.message);
  }
}

export default { revisarIdea };
