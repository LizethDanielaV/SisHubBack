import Idea from "../models/Idea.js";
import Estado from "../models/Estado.js";
import Usuario from "../models/Usuario.js";
import Grupo from "../models/Grupo.js";
import GrupoUsuario from "../models/GrupoUsuario.js";
import Equipo from "../models/Equipo.js";
import Proyecto from "../models/Proyecto.js"
import Actividad from "../models/Actividad.js";
import IntegranteEquipo from "../models/IntegrantesEquipo.js";
import HistorialIdea from "../models/HistorialIdea.js";
import db from "../db/db.js";
<<<<<<< HEAD
import { Op } from 'sequelize';
=======
import { Op, Sequelize } from 'sequelize';
>>>>>>> f9dbfc58c3f2bb43145ed565918c18d2c254b2bc

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

        const actividad = await Actividad.findOne({
            where: {
                codigo_materia: grupo.codigo_materia,
                nombre: grupo.nombre,
                periodo: grupo.periodo,
                anio: grupo.anio
            }
        });

        if (!actividad) {
            throw new Error("No se encontró una actividad asociada al grupo");
        }
        // Validar máximo de integrantes (líder + integrantes)
        if (integrantes && Array.isArray(integrantes)) {
            const totalIntegrantes = integrantes.length + 1; // +1 por el líder

            if (totalIntegrantes > actividad.maximo_integrantes) {
                throw new Error(`El equipo no puede tener más de ${actividad.maximo_integrantes} integrantes (incluyendo el líder). Intentas agregar ${totalIntegrantes} integrantes.`);
            }
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
            descripcion: `Equipo - ${codigo_usuario}`,
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

        const actividad = await Actividad.findOne({
            where: {
                codigo_materia: idea.codigo_materia,
                nombre: idea.nombre,
                periodo: idea.periodo,
                anio: idea.anio
            }
        });

        if (!actividad) {
            throw new Error("No se encontró la actividad asociada");
        }

        if (datosActualizacion.integrantes && Array.isArray(datosActualizacion.integrantes)) {
            const integrantesAgregar = datosActualizacion.integrantes;

            // Contar integrantes actuales del equipo
            const integrantesActuales = await IntegranteEquipo.count({
                where: { id_equipo: equipo.id_equipo }
            });

            // Validar que no se exceda el máximo
            const totalDespuesDeAgregar = integrantesActuales + integrantesAgregar.length;

            if (totalDespuesDeAgregar > actividad.maximo_integrantes) {
                throw new Error(`El equipo no puede tener más de ${actividad.maximo_integrantes} integrantes. Actualmente tiene ${integrantesActuales} integrantes e intentas agregar ${integrantesAgregar.length} más.`);
            }

            if (integrantesAgregar.length > 5) {
                throw new Error("No se pueden agregar más de 5 integrantes a la vez");
            }

            for (const codigoIntegrante of integrantesAgregar) {
                if (codigoIntegrante === codigo_usuario) {
                    throw new Error("El líder ya es parte del equipo");
                }

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
<<<<<<< HEAD
=======
    // 🔹 Buscar el estado 'LIBRE'
>>>>>>> f9dbfc58c3f2bb43145ed565918c18d2c254b2bc
    const estadoLibre = await Estado.findOne({
      where: { descripcion: "LIBRE" },
      attributes: ["id_estado"],
    });

    if (!estadoLibre) {
      throw new Error("No se encontró el estado 'LIBRE' en la base de datos");
    }

<<<<<<< HEAD
    const ideas = await Idea.findAll({
      where: {
        id_estado: estadoLibre.id_estado,
      },
=======
    // 🔹 Buscar las ideas con estado LIBRE
    const ideas = await Idea.findAll({
      where: { id_estado: estadoLibre.id_estado },
>>>>>>> f9dbfc58c3f2bb43145ed565918c18d2c254b2bc
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
        "anio",
      ],
      include: [
        {
          model: Estado,
          as: "Estado",
          attributes: ["descripcion"],
        },
        {
          model: Proyecto,
<<<<<<< HEAD
=======
          as: "proyectos", // ✅ Alias correcto
>>>>>>> f9dbfc58c3f2bb43145ed565918c18d2c254b2bc
          required: false, // LEFT JOIN
          attributes: ["id_proyecto"],
        },
      ],
      order: [["id_idea", "DESC"]],
<<<<<<< HEAD
      raw: true,
    });

    // ✅ Solo mantener ideas sin proyecto asociado
    const ideasSinProyecto = ideas.filter(i => i["Proyectos.id_proyecto"] === null);

    // ✅ Mapear para tener `estado` como campo plano
    const resultado = ideasSinProyecto.map(i => ({
=======
      limit: 100,
      raw: true,
    });

    // 🔹 Filtrar las ideas sin proyecto asociado
    const ideasSinProyecto = ideas.filter(
      (i) => i["proyectos.id_proyecto"] === null
    );

    // 🔹 Mapear resultado final con estado plano
    const resultado = ideasSinProyecto.map((i) => ({
>>>>>>> f9dbfc58c3f2bb43145ed565918c18d2c254b2bc
      id_idea: i.id_idea,
      titulo: i.titulo,
      problema: i.problema,
      justificacion: i.justificacion,
      objetivo_general: i.objetivo_general,
      objetivos_especificos: i.objetivos_especificos,
      codigo_materia: i.codigo_materia,
      nombre: i.nombre,
      periodo: i.periodo,
      anio: i.anio,
<<<<<<< HEAD
      estado: i["Estado.descripcion"], // estado fuera del include
=======
      estado: i["Estado.descripcion"],
>>>>>>> f9dbfc58c3f2bb43145ed565918c18d2c254b2bc
    }));

    return resultado;
  } catch (error) {
    console.error("Error al listar ideas LIBRES:", error);
<<<<<<< HEAD
    throw new Error("No fue posible listar las ideas con estado LIBRE y sin proyecto asociado");
=======
    throw new Error(
      "No fue posible listar las ideas con estado LIBRE y sin proyecto asociado"
    );
>>>>>>> f9dbfc58c3f2bb43145ed565918c18d2c254b2bc
  }
}


async function adoptarIdea(id_idea, codigo_usuario, grupo) {
    const t = await db.transaction();

    try {
        const idea = await Idea.findByPk(id_idea);
        if (!idea) throw new Error("La idea no existe");

        const estadoStandBy = await Estado.findOne({ where: { descripcion: "STAND_BY" } });
        if (!estadoStandBy) throw new Error("No se encontró el estado STAND_BY");

        // Crear equipo nuevo (siempre que adopta crea uno)
        const equipoAsociado = await Equipo.create(
            {
                descripcion: `Equipo - ${codigo_usuario}`, 
                codigo_materia: grupo.codigo_materia,
                nombre: grupo.nombre,
                periodo: grupo.periodo,
                anio: grupo.anio,
                estado: true
            },
            { transaction: t }
        );

        // Crear líder
        await IntegranteEquipo.create(
            {
                codigo_usuario,
                id_equipo: equipoAsociado.id_equipo,
                rol_equipo: "Líder",
                es_lider: true
            },
            { transaction: t }
        );

        // Actualizar la idea
        await idea.update(
            {
                id_estado: estadoStandBy.id_estado,
                codigo_usuario,
                codigo_materia: grupo.codigo_materia,
                nombre: grupo.nombre,
                periodo: grupo.periodo,
                anio: grupo.anio
            },
            { transaction: t }
        );

        await HistorialIdea.create(
            {
                fecha: new Date(),
                observacion: `Idea adoptada por el estudiante con código ${codigo_usuario}`,
                id_estado: estadoStandBy.id_estado,
                id_idea,
                codigo_usuario
            },
            { transaction: t }
        );

        await t.commit();

        return {
            message: "Idea adoptada correctamente",
            idea,
            equipo: equipoAsociado
        };
    } catch (error) {
        await t.rollback();
        console.error("Error al adoptar idea:", error);
        throw error;
    }
}

async function listarIdeasPorGrupo(datosGrupo) {
  try {
<<<<<<< HEAD
    // 🔹 Obtener los id_idea que ya tienen proyecto
    const ideasConProyecto = await Proyecto.findAll({
      attributes: ["id_idea"],
      raw: true,
    });

    const idsConProyecto = ideasConProyecto.map((p) => p.id_idea);

    // 🔹 Traer solo las ideas del grupo que no estén en esa lista
    const ideas = await Idea.findAll({
      where: {
        codigo_materia: datosGrupo.codigo_materia,
        nombre: datosGrupo.nombre,
        periodo: datosGrupo.periodo,
        anio: datosGrupo.anio,
        id_idea: { [Op.notIn]: idsConProyecto },
      },
=======
    const ideas = await Idea.findAll({
      attributes: [
        "id_idea",
        "titulo",
        "objetivo_general",
        "codigo_materia",
        "nombre",
        "periodo",
        "anio",
      ],
>>>>>>> f9dbfc58c3f2bb43145ed565918c18d2c254b2bc
      include: [
        {
          model: Estado,
          as: "Estado",
          attributes: ["descripcion"],
        },
        {
          model: Usuario,
          as: "Usuario",
          attributes: ["codigo", "nombre", "correo"],
        },
      ],
<<<<<<< HEAD
      order: [["id_idea", "DESC"]],
    });

    // 🔁 Formatear salida con estado fuera del objeto
    const resultado = ideas.map((idea) => ({
=======
      where: {
        codigo_materia: datosGrupo.codigo_materia,
        nombre: datosGrupo.nombre,
        periodo: datosGrupo.periodo,
        anio: datosGrupo.anio,
        // 🔥 aquí está la magia → NOT EXISTS exacto al SQL
        [Op.and]: [
          Sequelize.literal(`
            NOT EXISTS (
              SELECT 1 FROM proyecto p 
              WHERE p.id_idea = Idea.id_idea
            )
          `),
        ],
      },
      order: [["id_idea", "DESC"]],
    });

    return ideas.map((idea) => ({
>>>>>>> f9dbfc58c3f2bb43145ed565918c18d2c254b2bc
      id_idea: idea.id_idea,
      titulo: idea.titulo,
      objetivo_general: idea.objetivo_general,
      codigo_materia: idea.codigo_materia,
      nombre: idea.nombre,
      periodo: idea.periodo,
      anio: idea.anio,
<<<<<<< HEAD
      estado: idea.Estado?.descripcion || null, 
      Usuario: idea.Usuario, 
    }));

    return resultado;
=======
      estado: idea.Estado?.descripcion || null,
      usuario_codigo: idea.Usuario?.codigo || null,
      usuario_nombre: idea.Usuario?.nombre || null,
      usuario_correo: idea.Usuario?.correo || null,
    }));
>>>>>>> f9dbfc58c3f2bb43145ed565918c18d2c254b2bc
  } catch (error) {
    console.error("Error al listar ideas por grupo:", error);
    throw new Error("No fue posible listar las ideas del grupo sin proyecto");
  }
}


<<<<<<< HEAD
=======

>>>>>>> f9dbfc58c3f2bb43145ed565918c18d2c254b2bc
async function revisarIdea(id_idea, accion, observacion, codigo_usuario) {
    const transaction = await db.transaction();
    try {
        const idea = await Idea.findByPk(id_idea);
        if (!idea) throw new Error("Idea no encontrada");

<<<<<<< HEAD
        // Validar acción permitida
=======
>>>>>>> f9dbfc58c3f2bb43145ed565918c18d2c254b2bc
        const accionesValidas = ["Aprobar", "Aprobar_Con_Observacion", "Rechazar"];
        if (!accionesValidas.includes(accion)) {
            throw new Error("Acción no válida. Use: Aprobar, Aprobar_Con_Observacion o Rechazar");
        }

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

<<<<<<< HEAD
=======
                // 🔹 Buscar equipos del grupo
>>>>>>> f9dbfc58c3f2bb43145ed565918c18d2c254b2bc
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
<<<<<<< HEAD
                    const lider = await IntegranteEquipo.findOne({
                        where: {
                            codigo_usuario: idea.codigo_usuario,
                            es_lider: true,
                            id_equipo: { [Op.in]: idsEquipos }
                        },
                        include: [{ model: Equipo }],
                        transaction
                    });

                    if (lider && lider.equipo) {
                        const equipo = lider.equipo;
                        equipo.estado = false;
                        await equipo.save({ transaction });
                    }
                }

                // Cambiar campos de la idea
=======
                    // 🔸 Eliminar integrantes y equipo
                    await IntegranteEquipo.destroy({
                        where: { id_equipo: { [Op.in]: idsEquipos } },
                        transaction
                    });

                    await Equipo.destroy({
                        where: { id_equipo: { [Op.in]: idsEquipos } },
                        transaction
                    });
                }

                // 🔹 Restablecer idea
                const estadoLibre = await Estado.findOne({ where: { descripcion: "LIBRE" } });
                if (!estadoLibre) throw new Error("No se encontró el estado LIBRE.");

                idea.id_estado = estadoLibre.id_estado;
>>>>>>> f9dbfc58c3f2bb43145ed565918c18d2c254b2bc
                idea.codigo_materia = null;
                idea.nombre = null;
                idea.periodo = null;
                idea.anio = null;
<<<<<<< HEAD
                idea.codigo_usuario = null; // <--- se deja sin usuario
                // Buscar estado "LIBRE" y asignarlo
                const estadoLibre = await Estado.findOne({ where: { descripcion: "LIBRE" } });
                if (!estadoLibre) throw new Error("No se encontró el estado LIBRE.");
                idea.id_estado = estadoLibre.id_estado;

=======
                idea.codigo_usuario = null;
>>>>>>> f9dbfc58c3f2bb43145ed565918c18d2c254b2bc
                await idea.save({ transaction });
                break;
        }

        if (accion !== "Rechazar") {
            if (!nuevoEstado) throw new Error("No se encontró el estado correspondiente.");
            idea.id_estado = nuevoEstado.id_estado;
            await idea.save({ transaction });
        }

<<<<<<< HEAD
        // Registrar en historial
=======
        // 🔹 Registrar en historial
>>>>>>> f9dbfc58c3f2bb43145ed565918c18d2c254b2bc
        const textoObservacion = observacion
            ? `${mensaje} Observaciones: ${observacion}`
            : mensaje;

        await HistorialIdea.create({
            fecha: new Date(),
            observacion: textoObservacion,
            id_estado: idea.id_estado,
            id_idea,
            codigo_usuario
        }, { transaction });

        await transaction.commit();
        return { message: mensaje, idea };
<<<<<<< HEAD
=======

>>>>>>> f9dbfc58c3f2bb43145ed565918c18d2c254b2bc
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

<<<<<<< HEAD
        // Validar que la idea esté en estado STAND_BY
=======
>>>>>>> f9dbfc58c3f2bb43145ed565918c18d2c254b2bc
        const estadoStandBy = await Estado.findOne({ where: { descripcion: "STAND_BY" } });
        if (idea.id_estado !== estadoStandBy.id_estado)
            throw new Error("Solo se pueden mover al banco las ideas en estado 'Aprobada con observaciones'.");

<<<<<<< HEAD
        // Buscar estado de destino EN_BANCO
=======
>>>>>>> f9dbfc58c3f2bb43145ed565918c18d2c254b2bc
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

<<<<<<< HEAD
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
=======
        if (idsEquipos.length > 0) {
            // 🔸 Eliminar integrantes y equipo asociados
            await IntegranteEquipo.destroy({
                where: { id_equipo: { [Op.in]: idsEquipos } },
                transaction
            });

            await Equipo.destroy({
                where: { id_equipo: { [Op.in]: idsEquipos } },
                transaction
            });
        }

        // 🔹 Limpiar datos de la idea y actualizar estado
>>>>>>> f9dbfc58c3f2bb43145ed565918c18d2c254b2bc
        idea.id_estado = estadoBanco.id_estado;
        idea.codigo_usuario = null;
        idea.codigo_materia = null;
        idea.nombre = null;
        idea.periodo = null;
        idea.anio = null;
        await idea.save({ transaction });

<<<<<<< HEAD
        // Registrar en historial
=======
        // 🔹 Registrar en historial
>>>>>>> f9dbfc58c3f2bb43145ed565918c18d2c254b2bc
        await HistorialIdea.create({
            fecha: new Date(),
            observacion: "El estudiante decidió no corregir la idea. Movida al banco de ideas.",
            id_estado: estadoBanco.id_estado,
            id_idea: idea.id_idea,
            codigo_usuario
        }, { transaction });
<<<<<<< HEAD
        await transaction.commit();
        return { message: "Idea movida al banco de ideas exitosamente.", idea };
=======

        await transaction.commit();
        return { message: "Idea movida al banco de ideas y equipo eliminado exitosamente.", idea };

>>>>>>> f9dbfc58c3f2bb43145ed565918c18d2c254b2bc
    } catch (error) {
        await transaction.rollback();
        throw new Error("Error al mover la idea al banco: " + error.message);
    }
}

<<<<<<< HEAD
async function verificarIdeaYProyecto(codigo_usuario, grupo) {
  try {
    const idea = await Idea.findOne({
      where: {
        codigo_usuario,
        codigo_materia: grupo.codigo_materia,
        nombre: grupo.nombre,
        periodo: grupo.periodo,
        anio: grupo.anio
      },
      include: [
        { model: Estado, as: "Estado", attributes: ["descripcion"] }
      ]
    });

=======

async function verificarIdeaYProyecto(codigo_usuario, grupo) {
  try {
    console.log("codigo usuario", codigo_usuario);
>>>>>>> f9dbfc58c3f2bb43145ed565918c18d2c254b2bc
    const equipo = await Equipo.findOne({
      where: {
        codigo_materia: grupo.codigo_materia,
        nombre: grupo.nombre,
        periodo: grupo.periodo,
        anio: grupo.anio,
        estado: true
      },
      include: [
        {
          model: IntegranteEquipo,
          as: "Integrante_Equipos",
          where: { codigo_usuario },
<<<<<<< HEAD
          required: false
=======
          required: true
>>>>>>> f9dbfc58c3f2bb43145ed565918c18d2c254b2bc
        }
      ]
    });

<<<<<<< HEAD
=======
    // Si no pertenece a un equipo activo, puede crear idea nueva
    if (!equipo) {
      return {
        tieneIdea: false,
        idea: null,
        tieneProyecto: false,
        proyecto: null,
        equipo: null
      };
    }

    const lider = await IntegranteEquipo.findOne({
      where: {
        id_equipo: equipo.id_equipo,
        es_lider: true
      }
    });

    if (!lider) {
      throw new Error("El equipo activo no tiene un líder asignado.");
    }

    console.log("lider", lider);
    const idea = await Idea.findOne({
      where: {
        codigo_usuario: lider.codigo_usuario,
        codigo_materia: grupo.codigo_materia,
        nombre: grupo.nombre,
        periodo: grupo.periodo,
        anio: grupo.anio
      },
      include: [{ model: Estado, as: "Estado", attributes: ["descripcion"] }]
    });

>>>>>>> f9dbfc58c3f2bb43145ed565918c18d2c254b2bc
    let proyecto = null;
    if (idea) {
      proyecto = await Proyecto.findOne({
        where: { id_idea: idea.id_idea },
<<<<<<< HEAD
        include: [
          { model: Estado, as: "Estado", attributes: ["descripcion"] }
        ]
      });
    }

    // 4️⃣ Respuesta estructurada
=======
        include: [{ model: Estado, as: "Estado", attributes: ["descripcion"] }]


      });
    }

    const estadoIdea = idea?.Estado?.descripcion || null;
    const estadoProyecto = proyecto?.Estado?.descripcion || null;
>>>>>>> f9dbfc58c3f2bb43145ed565918c18d2c254b2bc
    return {
      tieneIdea: !!idea,
      idea: idea
        ? {
            id_idea: idea.id_idea,
            titulo: idea.titulo,
<<<<<<< HEAD
            estado: idea.Estado.descripcion
=======
            estado: estadoIdea
>>>>>>> f9dbfc58c3f2bb43145ed565918c18d2c254b2bc
          }
        : null,
      tieneProyecto: !!proyecto,
      proyecto: proyecto
        ? {
            id_proyecto: proyecto.id_proyecto,
            titulo: proyecto.titulo,
<<<<<<< HEAD
            estado: proyecto.Estado.descripcion
          }
        : null,
      equipo: equipo
        ? {
            id_equipo: equipo.id_equipo,
            activo: equipo.estado,
            miembros: equipo.Integrante_Equipos.length
          }
        : null
=======
            estado: estadoProyecto
          }
        : null,
      equipo: {
        id_equipo: equipo.id_equipo,
        activo: equipo.estado,
        lider: lider.codigo_usuario,
        miembros: equipo.Integrante_Equipos.length
      }
>>>>>>> f9dbfc58c3f2bb43145ed565918c18d2c254b2bc
    };
  } catch (error) {
    throw new Error("Error al verificar idea y proyecto: " + error.message);
  }
}

async function obtenerUltimoHistorialPorIdea(id_idea) {
  try {
    const historial = await HistorialIdea.findOne({
      where: { id_idea },
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

    if (!historial) {
      throw new Error("No hay historial registrado para esta idea");
    }

    return historial;
  } catch (error) {
    throw new Error("Error al obtener el último historial: " + error.message);
  }
}

export default { obtenerUltimoHistorialPorIdea, verificarIdeaYProyecto, crearIdea, actualizarIdea, obtenerIdeaPorId, listarIdeasLibres, adoptarIdea, listarIdeasPorGrupo, revisarIdea, moverIdeaAlBancoPorDecision };