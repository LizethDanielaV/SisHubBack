import MateriaService from "../services/MateriaService.js";

async function crear(req, res) {
    try {
        const materia = await MateriaService.crear(
            req.body.codigo, 
            req.body.nombre, 
            req.body.creditos,
            req.body.prerrequisitos,
            req.body.tipo,
            req.body.id_area)
        res.status(200).json(materia);
    } catch (error) {
        res.status(error.statusCode || 500).json({
            message: error.message || "Error interno del servidor",
          });
    }
};

export async function actualizar(req, res) {
  try {
    const { id_materia } = req.params;
    const nuevosDatos = req.body;

    const materiaActualizada = await MateriaService.actualizar(id_materia, nuevosDatos);

    res.status(200).json(materiaActualizada);
  } catch (error) {
    res.status(error.statusCode || 500).json({
            message: error.message || "Error al actualizar la materia",
          });
  }
}

export async function listar(req, res) {
  try {
    const materias = await MateriaService.listar();
    res.json(materias);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error al obtener materias", error: error.message });
  }
}
export default {crear, actualizar, listar};