import Materia from "../models/Materia.js";
import Area from "../models/Area.js";

async function crear(codigo, nombre, creditos, prerrequisitos, tipo, idArea) {
    isNaN
  if (!codigo || !nombre || !creditos || !prerrequisitos || !tipo || !idArea || isNaN(creditos) || isNaN(idArea)) {
    throw new Error("Datos no válidos");
  }
  try {
    const area = await Area.findByPk(idArea);
    if (!area) {
      throw new Error("Area no encontrado");
    }

    const materia = await Materia.create({
      codigo: codigo,
      nombre: nombre,
      creditos: creditos,
      prerrequisitos: prerrequisitos,
      tipo: tipo,
      id_area: area.id_area
    });
    return materia;
  } catch (error) {
    throw error;
  }
}

export default {crear};