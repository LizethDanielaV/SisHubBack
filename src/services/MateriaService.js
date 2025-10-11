import Materia from "../models/Materia.js";
import Area from "../models/Area.js";

async function crear(codigo, nombre,semestre, creditos, prerrequisitos, tipo, idArea) {

  if (!codigo || !nombre || !creditos ||!semestre || !prerrequisitos || !tipo || !idArea || isNaN(creditos) || isNaN(idArea)) {
    throw new Error("Datos no válidos");
  }
  //validar semestre
  validarSemestre(semestre);
  //validar creditos
  validarCreditos(creditos);

  try {
    const area = await Area.findByPk(idArea);
    if (!area) {
      throw new Error("Area no encontrada");
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
    if (error.name === "SequelizeUniqueConstraintError") {
    throw new Error("El código ya existe en la base de datos");
  }
    throw error;
  }
}


async function actualizar(idMateria, nuevosDatos) {
  const materiaExistente = await Materia.findByPk(idMateria);

  if (!materiaExistente) {
    throw new Error("Materia no encontrada");
  }

  if (nuevosDatos.semestre !== undefined) {
    validarSemestre(nuevosDatos.semestre);
  }
  if (nuevosDatos.creditos !== undefined) {
    validarCreditos(nuevosDatos.creditos);
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
      attributes: ['codigo', 'nombre'] 
    });
    return materias;
  } catch (error) {
    throw new Error("Error al obtener las materias " + error.message);
  }
}

function validarSemestre(semestre){
  const semestreN = Number(semestre);
  if(isNaN(semestreN)){
    throw new Error("El semestre debe ser un número");
  }
  if(semestreN <=0 || !Number.isInteger(semestreN)){
     throw new Error("El semestre debe ser un número natural (entero positivo)");
  }
  return true;
}

function validarCreditos(creditos){
  if (!Number.isInteger(creditos) || creditos <= 0) {
    throw new Error("Los créditos deben ser un número entero positivo");
  }
  return true;
}

export default { crear, actualizar, listar, buscarPorId, listarCodigos };