import IdeaService from "../services/IdeaService.js";

async function revisarIdea(req, res) {
  try {
    const { id_idea } = req.params;
    const { accion, observacion, codigo_usuario } = req.body;

    if (!codigo_usuario)
      return res.status(400).json({ message: "No se proporcionó el código del docente." });

    const resultado = await IdeaService.revisarIdea(
      id_idea,
      accion,
      observacion,
      codigo_usuario
    );

    res.status(200).json({
      message: "Revisión registrada correctamente",
      resultado,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}

export default {
  revisarIdea,
};
