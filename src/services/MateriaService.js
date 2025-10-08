import Materia from "../models/Materia.js";
import Area from "../models/Area.js";

async function crear(codigo, nombre,semestre, creditos, prerrequisitos, tipo, idArea) {
  isNaN
  if (!codigo || !nombre || !creditos ||!semestre || !prerrequisitos || !tipo || !idArea || isNaN(creditos) || isNaN(idArea)) {
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
      semestre: semestre,
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


async function actualizar(idMateria, nuevosDatos) {
  const materiaExistente = await Materia.findByPk(idMateria);

  if (!materiaExistente) {
    throw new Error("Materia no encontrada");
  }

  await materiaExistente.update(nuevosDatos);

  return materiaExistente;
}

async function listar() {
  try {
    const materias = await Materia.findAll({
      include: [{
        model: Area,
        attributes: ['nombre']
      }],
    });
    return materias;
  } catch (error) {
    throw new Error("Error al obtener las materias " + error.message);
  }
}

async function buscarPorId(idMateria) {
  if (!idMateria || isNaN(idMateria)) {
    throw new Error("El id no es válido");
  }
  try {
    const materiaBuscada = await Materia.findByPk(idMateria);

    if (!materiaBuscada) {
      throw new Error("Materia no encontrada");
    }
    return materiaBuscada;
  } catch (error) {
    throw new Error("Error al obtener la materia " + error.message);
  }
}

async function listarCodigos() {
  try {
    const materias = await Materia.findAll({
      attributes: ['id_materia', 'codigo', 'nombre'] 
    });
    return materias;
  } catch (error) {
    throw new Error("Error al obtener las materias " + error.message);
  }
}
export default { crear, actualizar, listar, buscarPorId, listarCodigos };