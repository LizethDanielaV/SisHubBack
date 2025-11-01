import EntregableService from "../services/EntregableService.js";

async function listarEntregablesPorActividad(req, res) {
  try {
    const { id_actividad } = req.params;

    if (!id_actividad) {
      return res.status(400).json({ message: "Debe proporcionar el id de la actividad." });
    }

    const entregables = await EntregableService.listarEntregablesPorActividad(id_actividad);

    if (entregables.message) {
      return res.status(200).json({ message: entregables.message });
    }

    return res.status(200).json(entregables);
  } catch (error) {
    res.status(500).json({
      message: "Error al listar los entregables de la actividad.",
      error: error.message,
    });
  }
}

async function retroalimentarEntregable(req, res) {
  try {
    const { id_entregable } = req.params;
    const { comentarios, calificacion, codigo_usuario } = req.body;

    if (!id_entregable) {
      return res.status(400).json({ message: "Debe proporcionar el id del entregable." });
    }

    const resultado = await EntregableService.retroalimentarEntregable(id_entregable,comentarios,calificacion,codigo_usuario);

    return res.status(200).json(resultado);
  } catch (error) {
    res.status(500).json({
      message: "Error al registrar la retroalimentación del entregable.",
      error: error.message,
    });
  }
}
export default { listarEntregablesPorActividad,retroalimentarEntregable };
