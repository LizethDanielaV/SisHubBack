import Idea from "../models/Idea.js";
import Estado from "../models/Estado.js";
import Usuario from "../models/Usuario.js";
import Grupo from "../models/Grupo.js";
import GrupoUsuario from "../models/GrupoUsuario.js";
import Equipo from "../models/Equipo.js";
import IntegranteEquipo from "../models/IntegrantesEquipo.js";
import HistorialIdea from "../models/HistorialIdea.js";
import db from "../db/db.js";

async function crearIdea(datosIdea, codigoUsuario) {
    const transaction = await db.transaction();

    try {
        const { titulo, problema, justificacion, objetivo_general, objetivos_especificos, grupo, integrantes } = datosIdea;

        // 1. Validar que el usuario existe y es estudiante
        const usuario = await Usuario.findOne({
            where: { codigo: codigoUsuario },
            include: [{ model: Estado, as: "Estado" }]
        });

        if (!usuario) {
            throw new Error("Usuario no encontrado");
        }

        if (usuario.id_rol !== 3) {
            throw new Error("Solo los estudiantes pueden crear ideas");
        }

        if (usuario.Estado && usuario.Estado.descripcion !== "ACTIVO") {
            throw new Error("El usuario debe estar activo para crear ideas");
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
            throw new Error("El grupo especificado no existe o no está activo");
        }

        // 3. Validar que el usuario pertenece al grupo
        const usuarioEnGrupo = await GrupoUsuario.findOne({
            where: {
                codigo_usuario: codigoUsuario,
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
                codigo_usuario: codigoUsuario,
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
            codigo_usuario: codigoUsuario,
            id_estado: estadoRevision.id_estado,
            codigo_materia: grupo.codigo_materia,
            nombre: grupo.nombre,
            periodo: grupo.periodo,
            anio: grupo.anio
        }, { transaction });

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
            codigo_usuario: codigoUsuario,
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
            if (integrantes.includes(codigoUsuario)) {
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

                if (usuarioIntegrante.Estado && usuarioIntegrante.Estado.descripcion !== "ACTIVO") {
                    throw new Error(`El usuario ${codigoIntegrante} no está activo`);
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
            codigo_usuario: codigoUsuario,
            observacion: "Idea creada y enviada a revisión"
        }, { transaction });

        await transaction.commit();

        // Retornar la idea con sus relaciones
        return await obtenerIdeaPorId(nuevaIdea.id_idea);

    } catch (error) {
        await transaction.rollback();
        throw error;
    }
}

async function actualizarIdea(idIdea, datosActualizacion, codigoUsuario) {
    const transaction = await db.transaction();

    try {
        // 1. Buscar la idea
        const idea = await Idea.findByPk(idIdea, {
            include: [{ model: Estado, as: "Estado" }]
        });

        if (!idea) {
            throw new Error("Idea no encontrada");
        }

        // 2. Validar que la idea pertenece al usuario
        if (idea.codigo_usuario !== codigoUsuario) {
            throw new Error("No tienes permiso para actualizar esta idea");
        }

        // 3. Validar que la idea está en STAND_BY
        if (idea.Estado.descripcion !== "STAND_BY") {
            throw new Error("Solo se pueden actualizar ideas en estado STAND_BY");
        }

        // 4. Actualizar campos permitidos de la idea
        const camposActualizables = ["titulo", "problema", "justificacion", "objetivo_general", "objetivos_especificos"];
        const datosParaActualizar = {};
        let seActualizoIdea = false;

        camposActualizables.forEach(campo => {
            if (datosActualizacion[campo] !== undefined) {
                datosParaActualizar[campo] = datosActualizacion[campo];
                seActualizoIdea = true;
            }
        });

        // 5. Cambiar estado a REVISION si se actualizó la idea
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
                codigo_usuario: codigoUsuario,
                observacion: "Idea actualizada tras observaciones y enviada nuevamente a revisión"
            }, { transaction });
        }

        // 6. Buscar el equipo asociado a la idea
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

        // 7. Agregar nuevos integrantes si vienen en el JSON
        if (datosActualizacion.integrantes_agregar && Array.isArray(datosActualizacion.integrantes_agregar)) {
            const integrantesAgregar = datosActualizacion.integrantes_agregar;

            if (integrantesAgregar.length > 5) {
                throw new Error("No se pueden agregar más de 5 integrantes a la vez");
            }

            for (const codigoIntegrante of integrantesAgregar) {
                // Validar que no sea el líder
                if (codigoIntegrante === codigoUsuario) {
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

                // Agregar al equipo
                await IntegranteEquipo.create({
                    codigo_usuario: codigoIntegrante,
                    id_equipo: equipo.id_equipo,
                    rol_equipo: "Integrante",
                    es_lider: false
                }, { transaction });
            }
        }

        // 8. Eliminar integrantes si vienen en el JSON
        if (datosActualizacion.integrantes_eliminar && Array.isArray(datosActualizacion.integrantes_eliminar)) {
            const integrantesEliminar = datosActualizacion.integrantes_eliminar;

            for (const codigoIntegrante of integrantesEliminar) {
                // Validar que no se intente eliminar al líder
                if (codigoIntegrante === codigoUsuario) {
                    throw new Error("No puedes eliminarte como líder del equipo");
                }

                // Buscar el integrante en el equipo
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

                // Eliminar del equipo
                await integrante.destroy({ transaction });
            }
        }

        await transaction.commit();

        return await obtenerIdeaPorId(idIdea);

    } catch (error) {
        await transaction.rollback();
        throw error;
    }
}

async function obtenerIdeaPorId(idIdea) {
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
            },
            {
                model: Grupo,
                as: "Grupo",
                attributes: ["codigo_materia", "nombre", "periodo", "anio"]
            }
        ]
    });

    if (!idea) {
        throw new Error("Idea no encontrada");
    }

    // Buscar el equipo asociado
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

    // Obtener historial de la idea
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

    return {
        ...idea.toJSON(),
        equipo: equipo ? equipo.toJSON() : null,
        historial
    };
}

async function listarIdeasUsuario(codigoUsuario) {
    const ideas = await Idea.findAll({
        where: { codigo_usuario: codigoUsuario },
        include: [
            {
                model: Estado,
                as: "Estado",
                attributes: ["descripcion"]
            },
            {
                model: Grupo,
                as: "Grupo",
                attributes: ["codigo_materia", "nombre", "periodo", "anio"]
            }
        ],
        order: [["id_idea", "DESC"]]
    });

    return ideas;
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


export default { crearIdea, actualizarIdea, obtenerIdeaPorId, listarIdeasUsuario, listarIdeasPorGrupo };