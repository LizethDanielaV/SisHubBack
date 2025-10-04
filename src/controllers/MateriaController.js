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

export default {crear};