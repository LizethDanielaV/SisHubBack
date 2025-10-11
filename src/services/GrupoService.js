import Grupo from "../models/Grupo.js";
import GrupoUsuario from "../models/GrupoUsuario.js";
import crypto from "crypto";
import QRCode from "qrcode";
import { Sequelize } from "sequelize";
import Materia from "../models/Materia.js";
import Area from "../models/Area.js";
import db from "../db/db.js";

async function crearGrupo(codigo_materia, nombre, periodo, anio, clave_acceso, codigo_docente) {
  if (!nombre || !codigo_materia || !codigo_docente || !periodo || !anio) {
    throw new Error("Datos incompletos");
  }

  const grupoExistente = await Grupo.findOne({ where: { codigo_materia, nombre, periodo, anio } });
  if (grupoExistente) {
    throw new Error("Ya existe un grupo con ese nombre");
  }

  try {
    const nuevoGrupo = await Grupo.create({
      codigo_materia: codigo_materia,
      nombre: nombre,
      periodo: periodo,
      anio: anio,
      clave_acceso: clave_acceso,
      estado: true,
    });

    const nuevoGrupoUsuario = await GrupoUsuario.create({
      fecha_ingreso: new Date(),
      codigo_usuario: codigo_docente,
      codigo_materia: codigo_materia,
      nombre: nombre,
      periodo: periodo,
      anio: anio
    });

    return nuevoGrupo;
  } catch (error) {
    throw new Error("Error al crear el grupo: " + error.message);
  }
}

async function actualizarEstado(codigo_materia, nombre, periodo, anio, nuevoEstado) {
  if (!codigo_materia || !nombre || !periodo || !anio) {
    throw new Error("Se requieren todos los identificadores del grupo");
  }
  try {
    const grupo = await Grupo.findOne({
      where: { codigo_materia, nombre, periodo, anio }
    });

    if (!grupo) {
      throw new Error("Grupo no encontrado");
    }
    grupo.estado = nuevoEstado;
    await grupo.save();
    return grupo;
  } catch (error) {
    throw new Error("Error al deshabilitar el grupo: " + error.message);
  }
}

function generarClaveAcceso() {
  return crypto
    .randomBytes(Math.ceil(4))
    .toString("hex")
    .slice(0, 8)
    .toUpperCase();
}

async function generarCodigoQR(codigo_materia, nombre, periodo, anio) {
  if (!codigo_materia || !nombre || !periodo || !anio) {
    throw new Error("Todos los identificadores del grupo son requeridos");
  }
  try {
    const grupo = await Grupo.findOne({
      where: { codigo_materia, nombre, periodo, anio }
    });
    if (!grupo) {
      throw new Error("Grupo no encontrado");
    }

    const url = `${process.env.BASE_URL_FRONTEND}/student/group/${codigo_materia}/${nombre}/${periodo}/${anio}?clave=${grupo.clave_acceso}`;
    const qr = await QRCode.toDataURL(url);
    return {
      codigo_materia,
      nombre,
      periodo,
      anio,
      qr
    };
  } catch (error) {
    throw new Error("Error al generar el codigo QR: " + error.message);
  }
}

async function obtenerClaveYCodigoQR(codigo_materia, nombre, periodo, anio) {
  if (!codigo_materia || !nombre || !periodo || !anio) {
    throw new Error("Todos los identificadores del grupo son requeridos");
  }
  try {
    const grupo = await Grupo.findOne({
      where: { codigo_materia, nombre, periodo, anio }
    });
    if (!grupo) {
      throw new Error("Grupo no encontrado");
    }

    // Reutiliza el método para generar el QR
    const { qr } = await generarCodigoQR(codigo_materia, nombre, periodo, anio);

    return {
      clave_acceso: grupo.clave_acceso,
      qr,
    };
  } catch (error) {
    throw new Error(
      "Error al obtener la clave y el código QR: " + error.message
    );
  }
}

async function listarGruposPorMateria(codigo_materia) {
  if (!codigo_materia) {
    throw new Error("El codigo de la materia es obligatorio");
  }

  try {
    const grupos = await Grupo.findAll({
      where: { codigo_materia },
      distinct: true,
      attributes: [
        "codigo_materia",
        "nombre",
        "periodo",
        "anio",
        "clave_acceso",
        "estado",
        [
          Sequelize.literal(`(
                SELECT COUNT(*) 
                FROM grupo_usuario gu 
                WHERE gu.codigo_materia = Grupo.codigo_materia AND gu.nombre = Grupo.nombre AND gu.periodo = Grupo.periodo AND gu.anio = Grupo.anio
                )`),
          "participantes",
        ],
        [
          Sequelize.literal(`(
                        SELECT u.nombre 
                        FROM grupo_usuario gu
                        JOIN Usuario u ON gu.codigo_usuario = u.codigo
                        WHERE gu.codigo_materia = Grupo.codigo_materia AND gu.nombre = Grupo.nombre AND gu.periodo = Grupo.periodo AND gu.anio = Grupo.anio
                        AND u.id_rol = 2
                        LIMIT 1
                    )`),
          "docente",
        ],
      ],
      raw: true,
    });

    return grupos.map((grupo) => ({
      codigo_materia: grupo.codigo_materia,
      nombre: grupo.nombre,
      periodo: grupo.periodo,
      anio: grupo.anio,
      clave_acceso: grupo.clave_acceso,
      estado: grupo.estado ? "Habilitado" : "Deshabilitado",
      participantes: grupo.participantes,
      docente: grupo.docente || "No asignado",
    }));
  } catch (error) {
    throw new Error("Error al listar grupos: " + error.message);
  }
}

async function listarGruposHabilitadosPorMateria(codigo_materia) {
  if (!codigo_materia) {
    throw new Error("El codigo de la materia es obligatoria");
  }

  try {
    const grupos = await Grupo.findAll({
      where: {
        codigo_materia,
        estado: true,
      },
      attributes: [
        "codigo_materia",
        "nombre",
        "periodo",
        "anio",
        "clave_acceso",
        [
          Sequelize.literal(`(
                        SELECT COUNT(*) 
                        FROM grupo_usuario gu 
                        WHERE gu.codigo_materia = Grupo.codigo_materia AND gu.nombre = Grupo.nombre AND gu.periodo = Grupo.periodo AND gu.anio = Grupo.anio
                    )`),
          "participantes",
        ],
        [
          Sequelize.literal(`(
                        SELECT u.nombre 
                        FROM grupo_usuario gu
                        JOIN Usuario u ON gu.codigo_usuario = u.codigo
                        WHERE gu.codigo_materia = Grupo.codigo_materia AND gu.nombre = Grupo.nombre AND gu.periodo = Grupo.periodo AND gu.anio = Grupo.anio
                        AND u.id_rol = 2
                        LIMIT 1
                    )`),
          "docente",
        ],
      ],
      raw: true,
    });

    return grupos.map((grupo) => ({
      codigo_materia: grupo.codigo_materia,
      nombre: grupo.nombre,
      periodo: grupo.periodo,
      anio: grupo.anio,
      clave_acceso: grupo.clave_acceso,
      participantes: grupo.participantes,
      docente: grupo.docente || "No asignado",
    }));
  } catch (error) {
    throw new Error("Error al listar grupos habilitados: " + error.message);
  }
}

async function listarGruposPorUsuario(codigo_usuario) {
  if (!codigo_usuario) {
    throw new Error("El código del usuario es obligatorio");
  }

  try {
    const resultado = await db.query(
      `
      SELECT 
        g.codigo_materia,
        g.nombre AS nombre_grupo,
        g.periodo AS periodo_grupo,
        g.anio AS anio_grupo,
        g.estado,
        g.clave_acceso,
        m.codigo AS codigo_materia,
        m.nombre AS nombre_materia,
        m.creditos,
        m.prerrequisitos,
        m.tipo AS tipo_materia,
        a.id_area,
        a.nombre AS area_conocimiento
      FROM grupo_usuario gu
      INNER JOIN Grupo g 
        ON g.codigo_materia = gu.codigo_materia
       AND g.nombre = gu.nombre
       AND g.periodo = gu.periodo
       AND g.anio = gu.anio
      INNER JOIN Materia m ON m.codigo = g.codigo_materia
      LEFT JOIN Area a ON a.id_area = m.id_area
      WHERE gu.codigo_usuario = :codigo_usuario
      ORDER BY g.anio DESC, g.periodo DESC;
      `,
      {
        replacements: { codigo_usuario },
        type: Sequelize.QueryTypes.SELECT,
      }
    );

    // Aseguramos que sea un array
    const grupos = Array.isArray(resultado) ? resultado : resultado[0];

    if (!grupos || grupos.length === 0) {
      return [];
    }

    return grupos.map((g) => ({
      codigo_materia: g.codigo_materia,
      nombre_materia: g.nombre_materia,
      creditos: g.creditos,
      prerrequisitos: g.prerrequisitos || "Ninguno",
      tipo_materia: g.tipo_materia,
      nombre_grupo: g.nombre_grupo,
      periodo_grupo: g.periodo_grupo,
      anio_grupo: g.anio_grupo,
      id_area: g.id_area,
      area_conocimiento: g.area_conocimiento || "No especificada",
      estado: g.estado ? "Habilitado" : "Deshabilitado",
      clave_acceso: g.clave_acceso,
    }));
  } catch (error) {
    throw new Error("Error al listar los grupos del docente: " + error.message);
  }
}


async function listarTodosLosGrupos() {
  try {
    const grupos = await Grupo.findAll({
      include: [
        {
          model: Materia,
          attributes: [
            "codigo",
            "nombre",
            "semestre",
            "creditos",
            "prerrequisitos",
            "tipo",
            "id_area"
          ],
          include: [
            {
              model: Area,
              attributes: ["id_area", "nombre"]
            }
          ]
        }
      ],
      attributes: [
        "id_grupo",
        "nombre",
        "estado",
        "periodo",
        "anio"
      ],
      raw: true,
      nest: true
    });

    return grupos.map((g) => ({
      id_grupo: g.id_grupo,
      nombre_grupo: g.nombre,
      codigo_materia: g.Materium?.codigo,
      nombre_materia: g.Materium?.nombre,
      semestre: g.Materium?.semestre,
      creditos: g.Materium?.creditos,
      prerrequisitos: g.Materium?.prerrequisitos || "Ninguno",
      tipo_materia: g.Materium?.tipo,
      id_area: g.Materium?.id_area || g.Materium?.Area?.id_area,
      nombre_area: g.Materium?.Area?.nombre || "No especificada",
      estado: g.estado ? 1 : 0,
      periodo: g.periodo,
      anio: g.anio
    }));
  } catch (error) {
    throw new Error("Error al listar todos los grupos: " + error.message);
  }
}

async function filtrarGrupos({
  codigo_materia,
  tipo_materia,
  area_conocimiento,
}) {
  try {
    // Obtener todos los grupos
    const grupos = await listarTodosLosGrupos();

    // Aplicar filtros dinámicamente
    const gruposFiltrados = grupos.filter((grupo) => {
      let cumple = true;
      if (codigo_materia) {
        cumple = cumple && grupo.codigo_materia === codigo_materia;
      }
      if (tipo_materia) {
        cumple = cumple && grupo.tipo_materia === tipo_materia;
      }
      if (area_conocimiento) {
        cumple = cumple && grupo.area_conocimiento === area_conocimiento;
      }
      return cumple;
    });

    return gruposFiltrados;
  } catch (error) {
    throw new Error("Error al filtrar los grupos: " + error.message);
  }
}

export default {
  crearGrupo,
  actualizarEstado,
  generarClaveAcceso,
  generarCodigoQR,
  obtenerClaveYCodigoQR,
  listarGruposPorMateria,
  listarGruposHabilitadosPorMateria,
  listarGruposPorUsuario,
  listarTodosLosGrupos,
  filtrarGrupos,
};