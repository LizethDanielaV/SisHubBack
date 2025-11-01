import Proyecto from "../models/Proyecto.js";
import Idea from "../models/Idea.js";
import Estado from "../models/Estado.js";
import Usuario from "../models/Usuario.js";
import Actividad from "../models/Actividad.js";
import ActividadItem from "../models/ActividadItem.js";
import IntegrantesEquipo from "../models/IntegrantesEquipo.js";
import Item from "../models/Item.js";
import TipoAlcance from "../models/TipoAlcance.js";
import Equipo from "../models/Equipo.js";
import HistorialProyecto from "../models/HistorialProyecto.js";
import db from "../db/db.js";

async function crearProyectoDesdeIdea(id_idea, datosProyecto, codigo_usuario) {
    const transaction = await db.transaction();

    try {
        const { linea_investigacion, tecnologias, palabras_clave } = datosProyecto;

        const idea = await Idea.findByPk(id_idea, {
            include: [{ model: Estado, as: "Estado" }]
        });

        if (!idea) {
            throw new Error("Idea no encontrada");
        }

        if (idea.Estado.descripcion !== "APROBADO") {
            throw new Error("Solo se puede crear proyecto para ideas en estado APROBADO");
        }

        const proyectoExistente = await Proyecto.findOne({
            where: { id_idea: id_idea }
        });

        if (proyectoExistente) {
            throw new Error("Esta idea ya tiene un proyecto asociado");
        }

        const actividad = await Actividad.findOne({
            where: {
                codigo_materia: idea.codigo_materia,
                nombre: idea.nombre,
                periodo: idea.periodo,
                anio: idea.anio
            },
            include: [
                {
                    model: TipoAlcance,
                    as: "Tipo_alcance",
                    attributes: ["id_tipo_alcance", "nombre"]
                }
            ]
        });

        if (!actividad) {
            throw new Error("No se encontró una actividad asociada al grupo de esta idea");
        }

        if (!actividad.id_tipo_alcance) {
            throw new Error("La actividad no tiene un tipo de alcance definido");
        }

        const itemsActividad = await ActividadItem.findAll({
            where: { id_actividad: actividad.id_actividad },
            include: [
                {
                    model: Item,
                    as: "Item",
                    attributes: ["id_item", "nombre", "super_item", "id_esquema"]
                }
            ]
        });

        if (!itemsActividad || itemsActividad.length === 0) {
            throw new Error("La actividad no tiene ítems de esquema seleccionados");
        }

        if (!linea_investigacion || linea_investigacion.trim().length === 0) {
            throw new Error("La línea de investigación es obligatoria");
        }

        if (linea_investigacion.length > 150) {
            throw new Error("La línea de investigación no puede exceder 150 caracteres");
        }

        if (tecnologias && tecnologias.length > 150) {
            throw new Error("Las tecnologías no pueden exceder 150 caracteres");
        }

        if (palabras_clave && palabras_clave.length > 150) {
            throw new Error("Las palabras clave no pueden exceder 150 caracteres");
        }

        const nuevoProyecto = await Proyecto.create({
            linea_investigacion,
            tecnologias: tecnologias || null,
            palabras_clave: palabras_clave || null,
            id_idea: id_idea,
            id_tipo_alcance: actividad.id_tipo_alcance
        }, { transaction });

        const equipo = await Equipo.findOne({
            where: {
                codigo_materia: idea.codigo_materia,
                nombre: idea.nombre,
                periodo: idea.periodo,
                anio: idea.anio
            }
        });

        await HistorialProyecto.create({
            id_proyecto: nuevoProyecto.id_proyecto,
            id_estado: idea.id_estado, // Mismo estado de la idea (APROBADO)
            codigo_usuario: codigo_usuario,
            observacion: `Proyecto creado a partir de la idea aprobada ID: ${id_idea}. Tipo de alcance: ${actividad.Tipo_alcance.nombre}. Items del esquema adoptados: ${itemsActividad.length}`
        }, { transaction });

        await transaction.commit();

        const proyectoCompleto = await Proyecto.findByPk(nuevoProyecto.id_proyecto, {
            include: [
                {
                    model: Idea,
                    as: "Idea",
                    attributes: ["id_idea", "titulo", "problema", "objetivo_general", "codigo_usuario"],
                    include: [
                        {
                            model: Usuario,
                            as: "Usuario",
                            attributes: ["codigo", "nombre", "correo"]
                        }
                    ]
                },
                {
                    model: TipoAlcance,
                    as: "Tipo_alcance",
                    attributes: ["id_tipo_alcance", "nombre"]
                }
            ]
        });

        return {
            ...proyectoCompleto.toJSON(),
            equipo: equipo ? {
                id_equipo: equipo.id_equipo,
                descripcion: equipo.descripcion
            } : null,
            esquema_adoptado: {
                total_items: itemsActividad.length,
                items: itemsActividad.map(ai => ({
                    id_item: ai.Item.id_item,
                    nombre: ai.Item.nombre,
                    id_esquema: ai.Item.id_esquema
                }))
            },
            actividad: {
                id_actividad: actividad.id_actividad,
                titulo: actividad.titulo
            }
        };

    } catch (error) {
        if (!transaction.finished) {
            await transaction.rollback();
        }
        throw error;
    }
}

async function obtenerProyectoPorId(idProyecto) {
    const proyecto = await Proyecto.findByPk(idProyecto, {
        include: [
            {
                model: Idea,
                as: "Idea",
                attributes: ["id_idea", "titulo", "problema", "objetivo_general", "justificacion", "objetivos_especificos", "codigo_materia", "nombre", "periodo", "anio"],
                include: [
                    {
                        model: Usuario,
                        as: "Usuario",
                        attributes: ["codigo", "nombre", "correo"]
                    },
                    {
                        model: Estado,
                        as: "Estado",
                        attributes: ["id_estado", "descripcion"]
                    }
                ]
            },
            {
                model: TipoAlcance,
                as: "Tipo_alcance",
                attributes: ["id_tipo_alcance", "nombre"]
            }
        ]
    });

    if (!proyecto) {
        throw new Error("Proyecto no encontrado");
    }

    const idea = proyecto.Idea;
    const equipo = await Equipo.findOne({
        where: {
            codigo_materia: idea.codigo_materia,
            nombre: idea.nombre,
            periodo: idea.periodo,
            anio: idea.anio
        },
        include: [
            {
                model: IntegrantesEquipo,
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

    const historial = await HistorialProyecto.findAll({
        where: { id_proyecto: idProyecto },
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
        ...proyecto.toJSON(),
        equipo: equipo ? equipo.toJSON() : null,
        historial
    };
}

async function listarProyectosPorGrupo(datosGrupo) {
    // Primero obtenemos las ideas de ese grupo
    const ideas = await Idea.findAll({
        where: {
            codigo_materia: datosGrupo.codigo_materia,
            nombre: datosGrupo.nombre,
            periodo: datosGrupo.periodo,
            anio: datosGrupo.anio
        },
        attributes: ["id_idea"]
    });

    if (!ideas || ideas.length === 0) {
        return [];
    }

    const idsIdeas = ideas.map(i => i.id_idea);

    const proyectos = await Proyecto.findAll({
        where: {
            id_idea: idsIdeas
        },
        include: [
            {
                model: Idea,
                as: "Idea",
                attributes: ["id_idea", "titulo", "codigo_usuario"],
                include: [
                    {
                        model: Usuario,
                        as: "Usuario",
                        attributes: ["codigo", "nombre", "correo"]
                    }
                ]
            },
            {
                model: TipoAlcance,
                as: "Tipo_alcance",
                attributes: ["id_tipo_alcance", "nombre"]
            }
        ],
        order: [["fecha_creacion", "DESC"]]
    });

    return proyectos;
}


async function actualizarProyecto(idProyecto, datosActualizacion, codigo_usuario) {
    const transaction = await db.transaction();

    try {
        const proyecto = await Proyecto.findByPk(idProyecto);

        if (!proyecto) {
            throw new Error("Proyecto no encontrado");
        }

        const { linea_investigacion, tecnologias, palabras_clave } = datosActualizacion;

        const datosParaActualizar = {};

        if (linea_investigacion !== undefined) {
            if (linea_investigacion.trim().length === 0) {
                throw new Error("La línea de investigación no puede estar vacía");
            }
            if (linea_investigacion.length > 150) {
                throw new Error("La línea de investigación no puede exceder 150 caracteres");
            }
            datosParaActualizar.linea_investigacion = linea_investigacion;
        }

        if (tecnologias !== undefined) {
            if (tecnologias.length > 150) {
                throw new Error("Las tecnologías no pueden exceder 150 caracteres");
            }
            datosParaActualizar.tecnologias = tecnologias;
        }

        if (palabras_clave !== undefined) {
            if (palabras_clave.length > 150) {
                throw new Error("Las palabras clave no pueden exceder 150 caracteres");
            }
            datosParaActualizar.palabras_clave = palabras_clave;
        }

        if (Object.keys(datosParaActualizar).length === 0) {
            throw new Error("No se proporcionaron campos para actualizar");
        }

        await proyecto.update(datosParaActualizar, { transaction });

        const estado = await Estado.findOne({
            where: { descripcion: "APROBADO" }
        });

        await HistorialProyecto.create({
            id_proyecto: idProyecto,
            id_estado: estado.id_estado,
            codigo_usuario: codigo_usuario,
            observacion: `Proyecto actualizado. Campos modificados: ${Object.keys(datosParaActualizar).join(", ")}`
        }, { transaction });

        await transaction.commit();

        return await obtenerProyectoPorId(idProyecto);

    } catch (error) {
        if (!transaction.finished) {
            await transaction.rollback();
        }
        throw error;
    }
}

export default {
    crearProyectoDesdeIdea,
    obtenerProyectoPorId,
    listarProyectos,
    listarProyectosPorGrupo,
    actualizarProyecto
};