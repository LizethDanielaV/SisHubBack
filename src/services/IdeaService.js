import Idea from "../models/Idea.js";
import Estado from "../models/Estado.js";
import Usuario from "../models/Usuario.js";
import Grupo from "../models/Grupo.js";
import GrupoUsuario from "../models/GrupoUsuario.js";
import Equipo from "../models/Equipo.js";
import IntegranteEquipo from "../models/IntegrantesEquipo.js";
import HistorialIdea from "../models/HistorialIdea.js";
import db from "../db/db.js";
import { Op } from 'sequelize';

async function crearIdea(datosIdea) {
  const transaction = await db.transaction();
  let idIdeaCreada = null;

    try {
        const {
            titulo,
            problema,
            justificacion,
            objetivo_general,
            objetivos_especificos,
            grupo,
            integrantes,
            codigo_usuario
        } = datosIdea;

    // 1. Validar que el usuario existe y es estudiante
    const usuario = await Usuario.findOne({
      where: { codigo: codigo_usuario },
      include: [{ model: Estado, as: "Estado" }]
    });

    if (!usuario) {
      throw new Error("Usuario no encontrado");
    }

    if (usuario.id_rol !== 3) {
      throw new Error("Solo los estudiantes pueden crear ideas");
    }

    if (usuario.Estado && usuario.Estado.descripcion !== "HABILITADO") {
      throw new Error("El usuario debe estar habilitado para crear ideas");
    }

    // 2. Validar que el grupo existe
    const grupoExiste = await Grupo.findOne({
      where: {
        codigo_materia: grupo.codigo_materia,
        nombre: grupo.nombre,
        periodo: grupo.periodo,
        anio: grupo.anio,
        estado: true
      }
    });

    if (!grupoExiste) {
      throw new Error("El grupo especificado no existe o no está habilitado");
    }

    // 3. Validar que el usuario pertenece al grupo
    const usuarioEnGrupo = await GrupoUsuario.findOne({
      where: {
        codigo_usuario: codigo_usuario,
        codigo_materia: grupo.codigo_materia,
        nombre: grupo.nombre,
        periodo: grupo.periodo,
        anio: grupo.anio,
        estado: true
      }
    });

    if (!usuarioEnGrupo) {
      throw new Error("El usuario no pertenece al grupo especificado");
    }

    // 4. Validar que el usuario no tenga otra idea en el mismo grupo
    const ideaExistente = await Idea.findOne({
      where: {
        codigo_usuario: codigo_usuario,
        codigo_materia: grupo.codigo_materia,
        nombre: grupo.nombre,
        periodo: grupo.periodo,
        anio: grupo.anio
      }
    });

    if (ideaExistente) {
      throw new Error("Ya tienes una idea registrada en este grupo");
    }

    // 5. Obtener el estado "REVISION" (estado inicial)
    const estadoRevision = await Estado.findOne({
      where: { descripcion: "REVISION" }
    });

    if (!estadoRevision) {
      throw new Error("Estado REVISION no encontrado en el sistema");
    }

    // 6. Crear la idea
    const nuevaIdea = await Idea.create({
      titulo,
      problema,
      justificacion,
      objetivo_general,
      objetivos_especificos,
      codigo_usuario: codigo_usuario,
      id_estado: estadoRevision.id_estado,
      codigo_materia: grupo.codigo_materia,
      nombre: grupo.nombre,
      periodo: grupo.periodo,
      anio: grupo.anio
    }, { transaction });

    idIdeaCreada = nuevaIdea.id_idea; // Guardar el ID

    // 7. Crear el equipo asociado a la idea
    const nuevoEquipo = await Equipo.create({
      descripcion: `Equipo - ${titulo}`,
      codigo_materia: grupo.codigo_materia,
      nombre: grupo.nombre,
      periodo: grupo.periodo,
      anio: grupo.anio,
      estado: true
    }, { transaction });

    // 8. Agregar al creador como líder del equipo
    await IntegranteEquipo.create({
      codigo_usuario: codigo_usuario,
      id_equipo: nuevoEquipo.id_equipo,
      rol_equipo: "Líder",
      es_lider: true
    }, { transaction });

    // 9. Agregar integrantes si vienen en el JSON
    if (integrantes && Array.isArray(integrantes) && integrantes.length > 0) {
      // Validar límite de integrantes
      if (integrantes.length > 10) {
        throw new Error("No se pueden agregar más de 10 integrantes al equipo");
      }

      // Validar que el líder no esté en la lista de integrantes
      if (integrantes.includes(codigo_usuario)) {
        throw new Error("El líder ya es parte del equipo automáticamente");
      }

      for (const codigoIntegrante of integrantes) {
        // Validar que el usuario existe
        const usuarioIntegrante = await Usuario.findOne({
          where: { codigo: codigoIntegrante },
          include: [{ model: Estado, as: "Estado" }]
        });

        if (!usuarioIntegrante) {
          throw new Error(`Usuario ${codigoIntegrante} no encontrado`);
        }

        if (usuarioIntegrante.id_rol !== 3) {
          throw new Error(`El usuario ${codigoIntegrante} no es estudiante`);
        }

        if (usuarioIntegrante.Estado && usuarioIntegrante.Estado.descripcion !== "HABILITADO") {
          throw new Error(`El usuario ${codigoIntegrante} no está habilitado`);
        }

        // Validar que el usuario pertenece al mismo grupo
        const integranteEnGrupo = await GrupoUsuario.findOne({
          where: {
            codigo_usuario: codigoIntegrante,
            codigo_materia: grupo.codigo_materia,
            nombre: grupo.nombre,
            periodo: grupo.periodo,
            anio: grupo.anio,
            estado: true
          }
        });

        if (!integranteEnGrupo) {
          throw new Error(`El usuario ${codigoIntegrante} no pertenece al grupo`);
        }

        // Agregar al equipo
        await IntegranteEquipo.create({
          codigo_usuario: codigoIntegrante,
          id_equipo: nuevoEquipo.id_equipo,
          rol_equipo: "Integrante",
          es_lider: false
        }, { transaction });
      }
    }

    // 10. Crear registro en historial
    await HistorialIdea.create({
      id_idea: nuevaIdea.id_idea,
      id_estado: estadoRevision.id_estado,
      codigo_usuario: codigo_usuario,
      observacion: "Idea creada y enviada a revisión"
    }, { transaction });

    // 11. COMMIT de la transacción
    await transaction.commit();

  } catch (error) {
    // Solo hacer rollback si la transacción NO se ha completado
    if (!transaction.finished) {
      await transaction.rollback();
    }
    throw error;
  }

  // 12. Obtener y retornar la idea con sus relaciones (FUERA del bloque try-catch de la transacción)
  try {
    return await obtenerIdeaPorId(idIdeaCreada);
  } catch (error) {
    // Si falla al obtener, al menos retornamos el ID
    console.error("Error al obtener idea creada:", error);
    return {
      id_idea: idIdeaCreada,
      mensaje: "Idea creada exitosamente, pero hubo un error al obtener los detalles completos"
    };
  }
}

async function actualizarIdea(idIdea, datosActualizacion) {
  const transaction = await db.transaction();

  try {
    const { codigo_usuario } = datosActualizacion;

    const idea = await Idea.findByPk(idIdea, {
      include: [{ model: Estado, as: "Estado" }]
    });

    if (!idea) {
      throw new Error("Idea no encontrada");
    }

    if (idea.codigo_usuario !== codigo_usuario) {
      throw new Error("No tienes permiso para actualizar esta idea");
    }

    if (idea.Estado.descripcion !== "STAND_BY") {
      throw new Error("Solo se pueden actualizar ideas en estado STAND_BY");
    }

    const camposActualizables = ["titulo", "problema", "justificacion", "objetivo_general", "objetivos_especificos"];
    const datosParaActualizar = {};
    let seActualizoIdea = false;

    camposActualizables.forEach(campo => {
      if (datosActualizacion[campo] !== undefined) {
        datosParaActualizar[campo] = datosActualizacion[campo];
        seActualizoIdea = true;
      }
    });

    if (seActualizoIdea) {
      const estadoRevision = await Estado.findOne({
        where: { descripcion: "REVISION" }
      });

      datosParaActualizar.id_estado = estadoRevision.id_estado;

      await idea.update(datosParaActualizar, { transaction });

      // Registrar en historial
      await HistorialIdea.create({
        id_idea: idIdea,
        id_estado: estadoRevision.id_estado,
        codigo_usuario: codigo_usuario,
        observacion: "Idea actualizada tras observaciones y enviada nuevamente a revisión"
      }, { transaction });
    }

    const equipo = await Equipo.findOne({
      where: {
        codigo_materia: idea.codigo_materia,
        nombre: idea.nombre,
        periodo: idea.periodo,
        anio: idea.anio
      }
    });

    if (!equipo) {
      throw new Error("Equipo no encontrado");
    }

    if (datosActualizacion.integrantes_agregar && Array.isArray(datosActualizacion.integrantes_agregar)) {
      const integrantesAgregar = datosActualizacion.integrantes_agregar;

      if (integrantesAgregar.length > 5) {
        throw new Error("No se pueden agregar más de 5 integrantes a la vez");
      }

      for (const codigoIntegrante of integrantesAgregar) {
        // Validar que no sea el líder
        if (codigoIntegrante === codigo_usuario) {
          throw new Error("El líder ya es parte del equipo");
        }

        // Validar que el usuario existe
        const usuarioIntegrante = await Usuario.findOne({
          where: { codigo: codigoIntegrante },
          include: [{ model: Estado, as: "Estado" }]
        });

        if (!usuarioIntegrante) {
          throw new Error(`Usuario ${codigoIntegrante} no encontrado`);
        }

        if (usuarioIntegrante.id_rol !== 3) {
          throw new Error(`El usuario ${codigoIntegrante} no es estudiante`);
        }

        // Validar que pertenece al grupo
        const integranteEnGrupo = await GrupoUsuario.findOne({
          where: {
            codigo_usuario: codigoIntegrante,
            codigo_materia: idea.codigo_materia,
            nombre: idea.nombre,
            periodo: idea.periodo,
            anio: idea.anio,
            estado: true
          }
        });

        if (!integranteEnGrupo) {
          throw new Error(`El usuario ${codigoIntegrante} no pertenece al grupo`);
        }

        // Validar que no esté ya en el equipo
        const yaEnEquipo = await IntegranteEquipo.findOne({
          where: {
            codigo_usuario: codigoIntegrante,
            id_equipo: equipo.id_equipo
          }
        });

        if (yaEnEquipo) {
          throw new Error(`El usuario ${codigoIntegrante} ya está en el equipo`);
        }

        await IntegranteEquipo.create({
          codigo_usuario: codigoIntegrante,
          id_equipo: equipo.id_equipo,
          rol_equipo: "Integrante",
          es_lider: false
        }, { transaction });
      }
    }

    if (datosActualizacion.integrantes_eliminar && Array.isArray(datosActualizacion.integrantes_eliminar)) {
      const integrantesEliminar = datosActualizacion.integrantes_eliminar;

      for (const codigoIntegrante of integrantesEliminar) {
        if (codigoIntegrante === codigo_usuario) {
          throw new Error("No puedes eliminarte como líder del equipo");
        }

        const integrante = await IntegranteEquipo.findOne({
          where: {
            codigo_usuario: codigoIntegrante,
            id_equipo: equipo.id_equipo,
            es_lider: false
          }
        });

        if (!integrante) {
          throw new Error(`El usuario ${codigoIntegrante} no es integrante del equipo`);
        }

        await integrante.destroy({ transaction });
      }
    }

    await transaction.commit();

  } catch (error) {
    if (!transaction.finished) {
      await transaction.rollback();
    }
    throw error;
  }

  try {
    return await obtenerIdeaPorId(idIdea);
  } catch (error) {
    console.error("Error al obtener idea actualizada:", error);
    return {
      id_idea: idIdea,
      mensaje: "Idea actualizada exitosamente, pero hubo un error al obtener los detalles completos"
    };
  }
}


async function obtenerIdeaPorId(idIdea) {
  // 1. Obtener la idea con sus relaciones simples
  const idea = await Idea.findByPk(idIdea, {
    include: [
      {
        model: Estado,
        as: "Estado",
        attributes: ["id_estado", "descripcion"]
      },
      {
        model: Usuario,
        as: "Usuario",
        attributes: ["codigo", "nombre", "correo"]
      }
      // NO incluir Grupo aquí porque no está asociado
    ]
  });

  if (!idea) {
    throw new Error("Idea no encontrada");
  }

  // 2. Obtener el grupo manualmente usando los campos de la idea
  const grupo = await Grupo.findOne({
    where: {
      codigo_materia: idea.codigo_materia,
      nombre: idea.nombre,
      periodo: idea.periodo,
      anio: idea.anio
    }
  });

  // 3. Buscar el equipo asociado
  const equipo = await Equipo.findOne({
    where: {
      codigo_materia: idea.codigo_materia,
      nombre: idea.nombre,
      periodo: idea.periodo,
      anio: idea.anio
    },
    include: [
      {
        model: IntegranteEquipo,
        as: "Integrante_Equipos",
        include: [
          {
            model: Usuario,
            as: "Usuario",
            attributes: ["codigo", "nombre", "correo"]
          }
        ]
      }
    ]
  });

  // 4. Obtener historial de la idea
  const historial = await HistorialIdea.findAll({
    where: { id_idea: idIdea },
    include: [
      {
        model: Estado,
        as: "Estado",
        attributes: ["descripcion"]
      },
      {
        model: Usuario,
        as: "Usuario",
        attributes: ["codigo", "nombre"]
      }
    ],
    order: [["fecha", "DESC"]]
  });

  // 5. Construir y retornar el objeto completo
  return {
    ...idea.toJSON(),
    Grupo: grupo ? grupo.toJSON() : {
      codigo_materia: idea.codigo_materia,
      nombre: idea.nombre,
      periodo: idea.periodo,
      anio: idea.anio
    },
    equipo: equipo ? equipo.toJSON() : null,
    historial
  };
}

async function listarIdeasLibres() {
    try {
        const estadoLibre = await Estado.findOne({
            where: { descripcion: "LIBRE" },
            attributes: ["id_estado"]
        });

        if (!estadoLibre) {
            throw new Error("No se encontró el estado 'LIBRE' en la base de datos");
        }

        const ideasLibres = await Idea.findAll({
            where: { id_estado: estadoLibre.id_estado },
            attributes: [
                "id_idea",
                "titulo",
                "problema",
                "justificacion",
                "objetivo_general",
                "objetivos_especificos",
                "codigo_materia",
                "nombre",
                "periodo",
                "anio"
            ],
            include: [
                {
                    model: Estado,
                    as: "Estado",
                    attributes: ["descripcion"]
                }
            ],
            order: [["id_idea", "DESC"]]
        })

        return ideasLibres;
    } catch (error) {
        console.error("Error al listar ideas LIBRES:", error);
        throw new Error("No fue posible listar las ideas con estado LIBRE");
    }
}

async function adoptarIdea(id_idea, datosAdopcion) {
  const transaction = await db.transaction();

  try {
    const { codigo_usuario, grupo } = datosAdopcion;

    const idea = await Idea.findByPk(id_idea, {
      include: [{ model: Estado, as: "Estado" }]
    });

    if (!idea) {
      throw new Error("Idea no encontrada");
    }

    if (idea.Estado.descripcion !== "LIBRE") {
      throw new Error("La idea no está disponible para adopción");
    }

    const usuario = await Usuario.findOne({ where: { codigo: codigo_usuario } });
    if (!usuario) {
      throw new Error("Usuario no encontrado");
    }

    if (usuario.id_rol !== 3) {
      throw new Error("Solo los estudiantes pueden adoptar ideas");
    }

    const grupoExiste = await Grupo.findOne({
      where: {
        codigo_materia: grupo.codigo_materia,
        nombre: grupo.nombre,
        periodo: grupo.periodo,
        anio: grupo.anio,
        estado: true
      }
    });

    if (!grupoExiste) {
      throw new Error("El grupo especificado no existe o no está habilitado");
    }

    const pertenece = await GrupoUsuario.findOne({
      where: {
        codigo_usuario,
        codigo_materia: grupo.codigo_materia,
        nombre: grupo.nombre,
        periodo: grupo.periodo,
        anio: grupo.anio,
        estado: true
      }
    });

    if (!pertenece) {
      throw new Error("El estudiante no pertenece al grupo seleccionado");
    }

    const estadoStandBy = await Estado.findOne({
      where: { descripcion: "STAND_BY" }
    });

    if (!estadoStandBy) {
      throw new Error("Estado STAND_BY no encontrado");
    }

    await idea.update({
      id_estado: estadoStandBy.id_estado,
      codigo_usuario,
      codigo_materia: grupo.codigo_materia,
      nombre: grupo.nombre,
      periodo: grupo.periodo,
      anio: grupo.anio
    }, { transaction });

    await HistorialIdea.create({
      id_idea,
      id_estado: estadoStandBy.id_estado,
      codigo_usuario,
      observacion: `Idea adoptada por el estudiante ${codigo_usuario} y asignada al grupo ${grupo.codigo_materia}-${grupo.nombre}-${grupo.periodo}-${grupo.anio}`
    }, { transaction });

    await transaction.commit();

    return { message: "Idea adoptada exitosamente", idea };

  } catch (error) {
    if (!transaction.finished) {
      await transaction.rollback();
    }
    throw new Error("Error al adoptar la idea: " + error.message);
  }
}

async function listarIdeasPorGrupo(datosGrupo) {
  const ideas = await Idea.findAll({
    where: {
      codigo_materia: datosGrupo.codigo_materia,
      nombre: datosGrupo.nombre,
      periodo: datosGrupo.periodo,
      anio: datosGrupo.anio
    },
    include: [
      {
        model: Estado,
        as: "Estado",
        attributes: ["descripcion"]
      },
      {
        model: Usuario,
        as: "Usuario",
        attributes: ["codigo", "nombre", "correo"]
      }
    ],
    order: [["id_idea", "DESC"]]
  });

  return ideas;
}

async function revisarIdea(id_idea, accion, observacion, codigo_usuario) {
  const transaction = await db.transaction();
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

        const equiposDelGrupo = await Equipo.findAll({
          where: {
            codigo_materia: idea.codigo_materia,
            nombre: idea.nombre,
            periodo: idea.periodo,
            anio: idea.anio
          },
          attributes: ['id_equipo']
        });

        const idsEquipos = equiposDelGrupo.map(e => e.id_equipo);

        if (idsEquipos.length > 0) {
          const lider = await IntegranteEquipo.findOne({
            where: {
              codigo_usuario: idea.codigo_usuario,
              es_lider: true,
              id_equipo: { [Op.in]: idsEquipos }
            }, include: [{ model: Equipo }],
            transaction
          });

          if (lider && lider.equipo) {
            const equipo = lider.equipo;
            equipo.estado = false;
            await equipo.save({ transaction });
          }
        }
        break;
    }

        if (!nuevoEstado) throw new Error("No se encontró el estado correspondiente.");

    // Actualizar la idea
    idea.id_estado = nuevoEstado.id_estado;
    await idea.save({ transaction });

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
    }, { transaction });
    await transaction.commit();
    return { message: mensaje, idea };
  } catch (error) {
    await transaction.rollback();
    throw new Error("Error al revisar la idea: " + error.message);
  }
}

async function moverIdeaAlBancoPorDecision(id_idea, codigo_usuario) {
  const transaction = await db.transaction();
  try {
    const idea = await Idea.findByPk(id_idea);
    if (!idea) throw new Error("Idea no encontrada");

    // Validar que la idea esté en estado STAND_BY
    const estadoStandBy = await Estado.findOne({ where: { descripcion: "STAND_BY" } });
    if (idea.id_estado !== estadoStandBy.id_estado)
      throw new Error("Solo se pueden mover al banco las ideas en estado 'Aprobada con observaciones'.");

    // Buscar estado de destino EN_BANCO
    const estadoBanco = await Estado.findOne({ where: { descripcion: "LIBRE" } });
    if (!estadoBanco) throw new Error("Estado 'LIBRE' no encontrado");

    const equiposDelGrupo = await Equipo.findAll({
      where: {
        codigo_materia: idea.codigo_materia,
        nombre: idea.nombre,
        periodo: idea.periodo,
        anio: idea.anio
      },
      attributes: ['id_equipo']
    });

    const idsEquipos = equiposDelGrupo.map(e => e.id_equipo);

    const lider = await IntegranteEquipo.findOne({
      where: {
        codigo_usuario: codigo_usuario,
        es_lider: true,
        id_equipo: idsEquipos.length > 0 ? { [Op.in]: idsEquipos } : null
      }, include: [{ model: Equipo }]
    });

    if (!lider || !lider.es_lider) {
      throw new Error("Solo el líder del equipo puede realizar esta acción.");
    }


    // 5️⃣ Desactivar ese equipo
    const equipo = lider.equipo;
    equipo.estado = false;
    await equipo.save({ transaction });

    // Cambiar estado
    idea.id_estado = estadoBanco.id_estado;
    idea.codigo_usuario = null;
    idea.codigo_materia = null;
    idea.nombre = null;
    idea.periodo = null;
    idea.anio = null;
    await idea.save({ transaction });

    // Registrar en historial
    await HistorialIdea.create({
      fecha: new Date(),
      observacion: "El estudiante decidió no corregir la idea. Movida al banco de ideas.",
      id_estado: estadoBanco.id_estado,
      id_idea: idea.id_idea,
      codigo_usuario
    }, { transaction });
    await transaction.commit();
    return { message: "Idea movida al banco de ideas exitosamente.", idea };
  } catch (error) {
    await transaction.rollback();
    throw new Error("Error al mover la idea al banco: " + error.message);
  }
}


export default {  crearIdea, actualizarIdea, obtenerIdeaPorId, listarIdeasLibres, adoptarIdea, listarIdeasPorGrupo, revisarIdea, moverIdeaAlBancoPorDecision };