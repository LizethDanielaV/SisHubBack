import Materia from "../models/Materia.js";
import Area from "../models/Area.js";
import fs from "fs";
import csv from "csv-parser";
import Sequelize from "sequelize";

async function crear(codigo, nombre,semestre, creditos, prerrequisitos, tipo, idArea) {

  if (!codigo || !nombre || !creditos ||!semestre  || !idArea || isNaN(creditos) || isNaN(idArea)) {
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

async function listarCodigos(semestre = null) {
  try {
    let whereClause = {};
    
    // Si se proporciona un semestre, filtrar materias de semestres anteriores
    // IMPORTANTE: Usar CAST porque semestre es STRING en la BD
    if (semestre !== null && semestre !== undefined) {
      whereClause = Sequelize.literal(
        `CAST(semestre AS UNSIGNED) < ${parseInt(semestre)}`
      );
    }
    
    const materias = await Materia.findAll({
      where: whereClause,
      attributes: ['codigo', 'nombre', 'semestre'],
      order: [
        [Sequelize.literal('CAST(semestre AS UNSIGNED)'), 'ASC'],
        ['codigo', 'ASC']
      ]
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

async function procesarCSV(pathArchivo) {
  return new Promise((resolve, reject) => {
    const materias = [];

    fs.createReadStream(pathArchivo)
      .pipe(csv())
      .on("data", (row) => {
        materias.push(row);
      })
      .on("end", async () => {
        try {
          const resultados = [];

          for (const m of materias) {
            try {
              // ✅ Conversión de valores numéricos
              const semestre = Number(m.semestre);
              const creditos = Number(m.creditos);
              const idArea = Number(m.id_area);

              await crear(
                m.codigo,
                m.nombre,
                semestre,
                creditos,
                m.prerrequisitos || "",
                m.tipo || "",
                idArea
              );

              resultados.push({
                codigo: m.codigo,
                estado: "creada",
                mensaje: "Materia creada correctamente"
              });
            } catch (error) {
              resultados.push({
                codigo: m.codigo,
                estado: "error",
                mensaje: error.message
              });
            }
          }

          fs.unlinkSync(pathArchivo); // Elimina el archivo después de procesar
          resolve(resultados);
        } catch (error) {
          reject(error);
        }
      })
      .on("error", (error) => reject(error));
  });
}

export default { crear, actualizar, listar, buscarPorId, listarCodigos, procesarCSV};