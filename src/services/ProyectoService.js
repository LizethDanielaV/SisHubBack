import Proyecto from "../models/Proyecto.js";
import Idea from "../models/Idea.js";
import Estado from "../models/Estado.js";
import Usuario from "../models/Usuario.js";
import Actividad from "../models/Actividad.js";
import IntegrantesEquipo from "../models/IntegrantesEquipo.js";
import TipoAlcance from "../models/TipoAlcance.js";
import Equipo from "../models/Equipo.js";
import HistorialProyecto from "../models/HistorialProyecto.js";
import Entregable from "../models/Entregable.js";
import Esquema from "../models/Esquema.js";
import IntegranteEquipo from "../models/IntegrantesEquipo.js";
import db from "../db/db.js";
import Grupo from "../models/Grupo.js";
import Materia from "../models/Materia.js";
import { Op } from 'sequelize';

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
                    attributes: ["id_tipo_alcance", "nombre"],
                    include: [
                        {
                            model: Esquema,
                            as: "Esquemas",
                            attributes: ["id_esquema", "ubicacion"]
                        }
                    ]
                }
            ]
        });

        if (!actividad) {
            throw new Error("No se encontró una actividad asociada al grupo de esta idea");
        }

        if (!actividad.id_tipo_alcance) {
            throw new Error("La actividad no tiene un tipo de alcance definido");
        }

        const estadoProyecto = await Estado.findOne({
            where: { descripcion: "EN_CURSO" }
        });

        if (!estadoProyecto) {
            throw new Error("No existe el estado 'EN_CURSO' en la tabla Estado");
        }

        // Validaciones
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

        // Crear el proyecto
        const nuevoProyecto = await Proyecto.create({
            linea_investigacion,
            tecnologias: tecnologias || null,
            palabras_clave: palabras_clave || null,
            id_idea: id_idea,
            id_tipo_alcance: actividad.id_tipo_alcance,
            id_estado: estadoProyecto.id_estado
        }, { transaction });

        // Obtener el equipo
        const equipo = await Equipo.findOne({
            where: {
                codigo_materia: idea.codigo_materia,
                nombre: idea.nombre,
                periodo: idea.periodo,
                anio: idea.anio
            }
        });

        // Registrar en historial
        await HistorialProyecto.create({
            id_proyecto: nuevoProyecto.id_proyecto,
            id_estado: idea.id_estado,
            codigo_usuario: codigo_usuario,
            observacion: `Proyecto creado a partir de la idea aprobada "${idea.titulo}". Tipo de alcance: ${actividad.Tipo_alcance.nombre}.`
        }, { transaction });

        await transaction.commit();

        // Obtener proyecto completo
        const proyectoCompleto = await Proyecto.findByPk(nuevoProyecto.id_proyecto, {
            include: [
                {
                    model: Idea,
                    as: "Idea",
                    attributes: [
                        "id_idea",
                        "titulo",
                        "problema",
                        "objetivo_general",
                        "codigo_materia",
                        "nombre",
                        "periodo",
                        "anio",
                        "codigo_usuario",
                        "id_estado"
                    ],
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
            actividad: {
                id_actividad: actividad.id_actividad,
                titulo: actividad.titulo,
                tipo_alcance: actividad.Tipo_alcance.nombre
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
                attributes: [
                    "id_idea",
                    "titulo",
                    "problema",
                    "objetivo_general",
                    "justificacion",
                    "objetivos_especificos",
                    "codigo_materia",
                    "nombre",
                    "periodo",
                    "anio",
                    "codigo_usuario"
                ],
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

    // Obtener el equipo
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

    // 1. Buscar el último entregable del proyecto
    const ultimoEntregable = await Entregable.findOne({
        where: { id_proyecto: idProyecto },
        include: [
            {
                model: Actividad,
                as: "actividad",
                attributes: ["id_actividad", "titulo", "codigo_materia", "nombre", "periodo", "anio"],
                include: [
                    {
                        model: TipoAlcance,
                        as: "Tipo_alcance",
                        attributes: ["id_tipo_alcance", "nombre"],
                        include: [
                            {
                                model: Esquema,
                                as: "Esquemas",
                                attributes: ["id_esquema", "ubicacion"]
                            }
                        ]
                    }
                ]
            }
        ],
        order: [["fecha_subida", "DESC"]],
        limit: 1
    });

    if (ultimoEntregable && ultimoEntregable.actividad) {
        actividadReferencia = ultimoEntregable.actividad;
        esquemaInfo = {
            origen: "ultimo_entregable",
            mensaje: "Esquema del último entregable realizado"
        };
    } else {
        const actividadActual = await Actividad.findOne({
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
                    attributes: ["id_tipo_alcance", "nombre"],
                    include: [
                        {
                            model: Esquema,
                            as: "Esquemas",
                            attributes: ["id_esquema", "ubicacion"]
                        }
                    ]
                }
            ]
        });

        if (actividadActual) {
            actividadReferencia = actividadActual;
            esquemaInfo = {
                origen: "actividad_actual",
                mensaje: "Esquema de la actividad actual (sin entregables aún)"
            };
        }
    }

    return {
        ...proyecto.toJSON(),
        equipo: equipo ? equipo.toJSON() : null,
        historial
    };
}

/*
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
}*/

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

async function listarProyectosDirector() {
    try {
        const proyectos = await Proyecto.findAll({
            include: [{
                model: TipoAlcance,
                attributes: ['nombre']
            }, {
                model: Idea,
                attributes: ['objetivo_general', 'titulo' ]
            },{
                model: Estado, 
                attributes: ['descripcion']
                }
            ],
        });
        return proyectos;
    } catch (error) {
        throw new Error("Error al obtener los proyectos " + error.message);
    }
}

async function listarTodosProyectosDeUnEstudiante(codigoEstudiante) {
    try {
        const proyectos = await Proyecto.findAll({
            attributes: ['id_proyecto', 'linea_investigacion', 'tecnologias', 'fecha_creacion'],
            include: [
                {
                    model: TipoAlcance,
                    attributes: ['nombre']
                },
                {
                    model: Idea,
                    attributes: ['titulo', 'objetivo_general']
                },
                {
                    model: Estado, 
                    attributes: ['descripcion']
                },
                {
                    model: Entregable,
                    attributes: ['id_entregable'],
                    include: [
                        {
                            model: Actividad,
                            attributes: ['id_actividad'],
                            include: [{
                                model: Grupo,
                                on: {
                                    '$entregables.actividad.codigo_materia$': { [db.Sequelize.Op.col]: 'entregables.actividad.Grupo.codigo_materia' },
                                    '$entregables.actividad.nombre$': { [db.Sequelize.Op.col]: 'entregables.actividad.Grupo.nombre' },
                                    '$entregables.actividad.periodo$': { [db.Sequelize.Op.col]: 'entregables.actividad.Grupo.periodo' },
                                    '$entregables.actividad.anio$': { [db.Sequelize.Op.col]: 'entregables.actividad.Grupo.anio' }
                                },
                                attributes: ['codigo_materia', 'nombre', 'periodo', 'anio'],
                                include: [{
                                    model: Materia,
                                    attributes: ['nombre']
                                }]
                            }
                            ]
                        }
                    ]
                },
                {
                    model: HistorialProyecto,
                    required: true,
                    attributes: [],
                    include: [
                        {
                            model: Equipo,
                            required: true,
                            attributes: [],
                            include: [
                                {
                                    model: IntegrantesEquipo,
                                    required: true,
                                    attributes: [],
                                    include: [
                                        {
                                            model: Usuario,
                                            attributes: ['codigo'],
                                            where: {
                                                codigo: codigoEstudiante
                                            },
                                            required: true
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                }
            ]
        });
        return proyectos;
    } catch (error) {
        throw new Error("Error al obtener los proyectos: " + error.message);
    }
}

async function listarTodosProyectosDeUnProfesor(codigoProfesor) {
    try {
        const proyectos = await Proyecto.findAll({
            attributes: ['id_proyecto', 'linea_investigacion', 'tecnologias', 'fecha_creacion'],
            include: [
                {
                    model: TipoAlcance,
                    attributes: ['nombre']
                },
                {
                    model: Estado, 
                    attributes: ['descripcion']
                },
                {
                    model: Idea,
                    attributes: ['titulo', 'objetivo_general']
                },
                {
                    model: Entregable,
                    attributes: ['id_entregable'],
                    include: [
                        {
                            model: Actividad,
                            attributes: ['id_actividad'],
                            include: [{
                                model: Grupo,
                                on: {
                                    '$entregables.actividad.codigo_materia$': { [db.Sequelize.Op.col]: 'entregables.actividad.Grupo.codigo_materia' },
                                    '$entregables.actividad.nombre$': { [db.Sequelize.Op.col]: 'entregables.actividad.Grupo.nombre' },
                                    '$entregables.actividad.periodo$': { [db.Sequelize.Op.col]: 'entregables.actividad.Grupo.periodo' },
                                    '$entregables.actividad.anio$': { [db.Sequelize.Op.col]: 'entregables.actividad.Grupo.anio' }
                                },
                                attributes: ['codigo_materia', 'nombre', 'periodo', 'anio'],
                                include: [{
                                    model: Materia,
                                    attributes: ['nombre']
                                }]
                            }
                            ]
                        }
                    ]
                },
                {
                    model: HistorialProyecto,
                    required: true,
                    attributes: [],
                    include: [
                        {
                            model: Usuario,
                            required: true,
                            attributes: [],
                            where: {
                                codigo: codigoProfesor
                            },
                            required: true
                        }
                    ]
                }
            ]
        });
        const resultado = proyectos.map(proyecto => {
            // obtener materias asociadas (sin duplicados)
            const materias = [];

            proyecto.entregables?.forEach(entregable => {
                const materia = entregable.actividad?.Grupo?.Materium;
                if (materia && materia.nombre && !materias.some(m => m.nombre === materia.nombre)) {
                    materias.push({ nombre: materia.nombre });
                }
            });

            return {
                id_proyecto: proyecto.id_proyecto,
                linea_investigacion: proyecto.linea_investigacion,
                tecnologias: proyecto.tecnologias,
                fecha_creacion: proyecto.fecha_creacion,
                Tipo_alcance: proyecto.TipoAlcance,
                Idea: proyecto.Idea,
                materias: materias
            };
        });
        return resultado;
    } catch (error) {
        throw new Error("Error al obtener los proyectos: " + error.message);
    }
}

async function listarTodosProyectosDeUnGrupo(codigoMateria, nombre, periodo, anio) {
    try {
        const proyectos = await Proyecto.findAll({
            attributes: ['id_proyecto', 'linea_investigacion', 'tecnologias', 'fecha_creacion'],
            include: [
                {
                    model: TipoAlcance,
                    attributes: ['nombre']
                },
                {
                    model: Estado, 
                    attributes: ['descripcion']
                },
                {
                    model: Idea,
                    attributes: ['titulo', 'objetivo_general']
                },
                {
                    model: Entregable,
                    attributes: ['id_entregable'],
                    include: [
                        {
                            model: Actividad,
                            attributes: ['id_actividad'],
                            include: [
                                {
                                    model: Grupo,
                                    attributes: ['codigo_materia', 'nombre', 'periodo', 'anio'],
                                    on: {
                                        '$entregables.actividad.codigo_materia$': { [db.Sequelize.Op.eq]: db.Sequelize.col('entregables->actividad->Grupo.codigo_materia') },
                                        '$entregables.actividad.nombre$': { [db.Sequelize.Op.eq]: db.Sequelize.col('entregables->actividad->Grupo.nombre') },
                                        '$entregables.actividad.periodo$': { [db.Sequelize.Op.eq]: db.Sequelize.col('entregables->actividad->Grupo.periodo') },
                                        '$entregables.actividad.anio$': { [db.Sequelize.Op.eq]: db.Sequelize.col('entregables->actividad->Grupo.anio') }
                                    },
                                    where: {
                                        codigo_materia: codigoMateria,
                                        nombre: nombre,
                                        periodo: periodo,
                                        anio: anio
                                    },
                                    required: true
                                }
                            ]
                        }
                    ]
                }
            ]
        });
        const resultado = proyectos.map(p => ({
            id_proyecto: p.id_proyecto,
            linea_investigacion: p.linea_investigacion,
            tecnologias: p.tecnologias,
            fecha_creacion: p.fecha_creacion,
            Tipo_alcance: p.TipoAlcance,
            Idea: p.Idea
        }));
        return resultado;
    } catch (error) {
        throw new Error("Error al obtener los proyectos: " + error.message);
    }
}

async function calificarProyecto(id_proyecto, observacion, codigo_usuario) {
    const transaction = await db.transaction();
    try {
        if (!codigo_usuario) throw new Error("Debe especificar el código del usuario que realiza la calificación.");

        // Buscar proyecto
        const proyecto = await Proyecto.findByPk(id_proyecto, {
            include: [{ model: Idea }],
            transaction
        });
        if (!proyecto) throw new Error("Proyecto no encontrado.");

        // Buscar estado "CALIFICADO"
        const estadoCalificado = await Estado.findOne({
            where: { descripcion: "CALIFICADO" },
            transaction
        });
        if (!estadoCalificado) throw new Error("No existe el estado 'CALIFICADO' en la tabla Estado.");

        // Actualizar estado del proyecto e idea
        proyecto.id_estado = estadoCalificado.id_estado;
        await proyecto.save({ transaction });

        if (proyecto.Idea) {
            proyecto.Idea.id_estado = estadoCalificado.id_estado;
            await proyecto.Idea.save({ transaction });
        }

        // Buscar equipo relacionado (opcional)
        const equipo = await Equipo.findOne({
            where: {
                codigo_materia: proyecto.Idea.codigo_materia,
                nombre: proyecto.Idea.nombre,
                periodo: proyecto.Idea.periodo,
                anio: proyecto.Idea.anio
            },
            transaction
        });

        // Registrar en historial
        await HistorialProyecto.create({
            fecha: new Date(),
            observacion: observacion
                ? `Proyecto calificado. Observaciones: ${observacion}`
                : "Proyecto calificado sin observaciones.",
            id_estado: estadoCalificado.id_estado,
            id_proyecto,
            codigo_usuario,
            id_equipo: equipo ? equipo.id_equipo : null
        }, { transaction });

        await transaction.commit();

        return { message: "Proyecto calificado exitosamente.", proyecto };
    } catch (error) {
        await transaction.rollback();
        throw new Error("Error al calificar el proyecto: " + error.message);
    }
}

async function revisarProyecto(id_proyecto, accion, observacion, codigo_usuario) {
    const transaction = await db.transaction();
    try {
        if (!codigo_usuario)
            throw new Error("Debe especificar el código del usuario que realiza la revisión.");

        const accionesValidas = ["Aprobar", "Aprobar_Con_Observacion", "Rechazar"];
        if (!accionesValidas.includes(accion)) throw new Error("Acción no válida.");

        const proyecto = await Proyecto.findByPk(id_proyecto, {
            include: [{ model: Idea }],
            transaction,
        });
        if (!proyecto) throw new Error("Proyecto no encontrado.");

        let nuevoEstadoProyecto = null;
        let nuevoEstadoIdea = null;
        let mensaje = "";
        let idEquipoHistorial = null;
        let lider;

        // Buscar equipos del grupo
        const equiposDelGrupo = await Equipo.findAll({
            where: {
                codigo_materia: proyecto.Idea.codigo_materia,
                nombre: proyecto.Idea.nombre,
                periodo: proyecto.Idea.periodo,
                anio: proyecto.Idea.anio,
            },
            attributes: ["id_equipo"],
        });

        const idsEquipos = equiposDelGrupo.map((e) => e.id_equipo);

        if (idsEquipos.length > 0) {
            lider = await IntegranteEquipo.findOne({
                where: {
                    codigo_usuario: proyecto.Idea.codigo_usuario,
                    es_lider: true,
                    id_equipo: { [Op.in]: idsEquipos },
                },
                include: [{ model: Equipo }],
                transaction,
            });
        }

        // Estados de referencia
        const estadoEnCurso = await Estado.findOne({ where: { descripcion: "EN_CURSO" }, transaction });
        const estadoStandBy = await Estado.findOne({ where: { descripcion: "STAND_BY" }, transaction });
        const estadoRechazado = await Estado.findOne({ where: { descripcion: "RECHAZADO" }, transaction });
        const estadoCalificado = await Estado.findOne({ where: { descripcion: "CALIFICADO" }, transaction });
        const estadoLibre = await Estado.findOne({ where: { descripcion: "LIBRE" }, transaction });
        const estadoAprobada = await Estado.findOne({ where: { descripcion: "APROBADA" }, transaction });

        // Verificación
        if (!estadoEnCurso || !estadoStandBy || !estadoRechazado)
            throw new Error("No se encontraron los estados requeridos.");

        // 🔁 Lógica según acción
        switch (accion) {
            case "Aprobar":
                nuevoEstadoProyecto = estadoEnCurso;
                nuevoEstadoIdea = estadoAprobada;
                mensaje = "Proyecto aprobado sin observaciones.";
                break;

            case "Aprobar_Con_Observacion":
                nuevoEstadoProyecto = proyecto.id_estado; // se mantiene igual
                nuevoEstadoIdea = estadoStandBy;
                mensaje = "Proyecto aprobado con observaciones.";
                break;

            case "Rechazar":
                nuevoEstadoProyecto = estadoCalificado;

                if (proyecto.id_estado === estadoCalificado.id_estado) {
                    nuevoEstadoIdea = estadoAprobada;
                } else {
                    nuevoEstadoIdea = estadoLibre;

                    if (lider && lider.equipo) {
                        lider.equipo.estado = false;
                        await lider.equipo.save({ transaction });
                        idEquipoHistorial = lider.equipo.id_equipo;
                    }

                    proyecto.Idea.codigo_materia = null;
                    proyecto.Idea.nombre = null;
                    proyecto.Idea.periodo = null;
                    proyecto.Idea.anio = null;
                    await proyecto.Idea.save({ transaction });
                }

                mensaje = "Proyecto rechazado. El equipo deberá presentar una nueva propuesta.";
                break;
        }

        proyecto.id_estado = nuevoEstadoProyecto.id_estado;
        await proyecto.save({ transaction });

        if (proyecto.Idea) {
            proyecto.Idea.id_estado = nuevoEstadoIdea.id_estado;
            await proyecto.Idea.save({ transaction });
        }

        if (!idEquipoHistorial && lider?.equipo) {
            idEquipoHistorial = lider.equipo.id_equipo;
        }

        // 🕓 Historial
        const textoObservacion = observacion
            ? `${mensaje} Observaciones: ${observacion}`
            : mensaje;

        await HistorialProyecto.create(
            {
                fecha: new Date(),
                observacion: textoObservacion,
                id_estado: nuevoEstadoProyecto.id_estado,
                id_proyecto,
                codigo_usuario,
                id_equipo: idEquipoHistorial,
            },
            { transaction }
        );

        await transaction.commit();
        return { message: mensaje, proyecto };
    } catch (error) {
        await transaction.rollback();
        throw new Error("Error al revisar el proyecto: " + error.message);
    }
}

async function liberarProyecto(idProyecto, codigo_usuario) {
    const transaction = await db.transaction();

    try {
        const proyecto = await Proyecto.findByPk(idProyecto, {
            include: [
                {
                    model: Idea,
                    as: "Idea",
                    include: [{ model: Estado, as: "Estado" }]
                }
            ],
            transaction
        });

        if (!proyecto) throw new Error("Proyecto no encontrado");
        if (!proyecto.Idea) throw new Error("No se encontró la idea asociada al proyecto");

        const idea = proyecto.Idea;

        const equipos = await Equipo.findAll({
            where: {
                codigo_materia: idea.codigo_materia,
                nombre: idea.nombre,
                periodo: idea.periodo,
                anio: idea.anio
            },
            transaction
        });

        if (!equipos || equipos.length === 0) {
            throw new Error("No se encontró un equipo asociado al proyecto");
        }

        let equipo = null;
        for (const eq of equipos) {
            const lider = await IntegranteEquipo.findOne({
                where: {
                    id_equipo: eq.id_equipo,
                    codigo_usuario,
                    es_lider: true
                },
                transaction
            });

            if (lider) {
                equipo = eq;
                break;
            }
        }

        if (!equipo) {
            throw new Error("Solo el líder del equipo puede liberar el proyecto");
        }

        const estadoLibre = await Estado.findOne({
            where: { descripcion: "LIBRE" },
            transaction
        });

        if (!estadoLibre) throw new Error("No se encontró el estado 'LIBRE'");

        idea.id_estado = estadoLibre.id_estado;
        idea.codigo_usuario = null;
        idea.codigo_materia = null;
        idea.nombre = null;
        idea.periodo = null;
        idea.anio = null;
        await idea.save({ transaction });

        if (equipo) {
            equipo.estado = false;
            await equipo.save({ transaction });
        }

        await HistorialProyecto.create({
            id_proyecto: idProyecto,
            id_estado: estadoLibre.id_estado,
            codigo_usuario,
            observacion: `El líder del equipo liberó la idea asociada al proyecto. Ahora está disponible para nuevos equipos.`,
            fecha: new Date(),
            id_equipo: equipo.id_equipo
        }, { transaction });

        await transaction.commit();

        return {
            message: "Proyecto liberado exitosamente. La idea ha sido marcada como LIBRE.",
            id_proyecto: idProyecto,
            id_idea: idea.id_idea
        };
    } catch (error) {
        if (!transaction.finished) {
            await transaction.rollback();
        }
        throw new Error("Error al liberar el proyecto: " + error.message);
    }
}

async function listarPropuestasLibres() {
  try {
    const estadoLibre = await Estado.findOne({
      where: { descripcion: "LIBRE" },
      attributes: ["id_estado"],
    });

    if (!estadoLibre) {
      throw new Error("No se encontró el estado 'LIBRE'");
    }

    const estadoCalificado = await Estado.findOne({
      where: { descripcion: "CALIFICADO" },
      attributes: ["id_estado"],
    });

    if (!estadoCalificado) {
      throw new Error("No se encontró el estado 'CALIFICADO'");
    }

    const propuestasLibres = await Idea.findAll({
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
        "anio",
      ],
      include: [
        {
          model: Estado,
          attributes: ["descripcion"],
        },
        {
          model: Proyecto,
          as: "proyectos",
          attributes: ["id_proyecto", "id_estado"],
          required: true,
          include: [
            {
              model: Estado,
              attributes: ["descripcion"],
              where: { descripcion: "CALIFICADO" }, 
            },
          ],
        },
      ],
      order: [["id_idea", "DESC"]],
    });

    return propuestasLibres;
  } catch (error) {
    console.error("Error al listar propuestas LIBRES:", error);
    throw new Error(
      "No fue posible listar las propuestas con estado LIBRE y proyecto CALIFICADO"
    );
  }
}


async function adoptarPropuesta(id_proyecto, codigo_usuario, grupo) {
    const t = await db.transaction();

    try {
        const proyecto = await Proyecto.findByPk(id_proyecto, {
            include: [{ model: Idea, as: "Idea" }],
            transaction: t
        });

        if (!proyecto) throw new Error("El proyecto no existe");
        if (!proyecto.Idea) throw new Error("El proyecto no tiene una idea asociada");

        const idea = proyecto.Idea;

        const estadoSeleccionado = await Estado.findOne({
            where: { descripcion: "SELECCIONADO" },
            transaction: t
        });
        if (!estadoSeleccionado)
            throw new Error("No se encontró el estado SELECCIONADO en la tabla Estado.");

        const estadoRevision = await Estado.findOne({
            where: { descripcion: "REVISION" },
            transaction: t
        });
        if (!estadoRevision)
            throw new Error("No se encontró el estado REVISION en la tabla Estado.");

        // Crear nuevo equipo
        const equipoAsociado = await Equipo.create(
            {
                descripcion: `Equipo de ${codigo_usuario}`,
                codigo_materia: grupo.codigo_materia,
                nombre: grupo.nombre,
                periodo: grupo.periodo,
                anio: grupo.anio,
                estado: true
            },
            { transaction: t }
        );

        await IntegranteEquipo.create(
            {
                codigo_usuario,
                id_equipo: equipoAsociado.id_equipo,
                rol_equipo: "Líder",
                es_lider: true
            },
            { transaction: t }
        );

        await proyecto.update(
            { id_estado: estadoSeleccionado.id_estado },
            { transaction: t }
        );

        await idea.update(
            {
                id_estado: estadoRevision.id_estado,
                codigo_usuario,
                codigo_materia: grupo.codigo_materia,
                nombre: grupo.nombre,
                periodo: grupo.periodo,
                anio: grupo.anio
            },
            { transaction: t }
        );

        await HistorialProyecto.create(
            {
                id_proyecto,
                id_estado: estadoRevision.id_estado,
                codigo_usuario,
                observacion: `El líder ${codigo_usuario} adoptó la propuesta del banco de proyectos. Proyecto en estado SELECCIONADO, idea en REVISION.`,
                fecha: new Date(),
                id_equipo: equipoAsociado.id_equipo
            },
            { transaction: t }
        );

        await t.commit();

        return {
            message: "Propuesta adoptada correctamente (Proyecto: SELECCIONADO, Idea: STAND_BY).",
            proyecto,
            equipo: equipoAsociado
        };
    } catch (error) {
        await t.rollback();
        console.error("Error al adoptar propuesta:", error);
        throw new Error("Error al adoptar la propuesta: " + error.message);
    }
}

async function continuarProyecto(idProyecto, codigo_usuario) {
    const t = await db.transaction();
    try {
        const proyecto = await Proyecto.findByPk(idProyecto, {
            include: [{ model: Idea, as: "Idea" }],
            transaction: t
        });

        if (!proyecto) throw new Error("Proyecto no encontrado.");
        if (!proyecto.Idea) throw new Error("El proyecto no tiene idea asociada.");

        // Verificar que el proyecto esté calificado
        const estadoCalificado = await Estado.findOne({
            where: { descripcion: "CALIFICADO" },
            transaction: t
        });
        if (!estadoCalificado) throw new Error("No existe el estado CALIFICADO en la tabla Estado.");

        if (proyecto.id_estado !== estadoCalificado.id_estado) {
            throw new Error("Solo se pueden continuar proyectos con estado CALIFICADO.");
        }

        // Cambiar la idea a REVISION
        const estadoRevision = await Estado.findOne({
            where: { descripcion: "REVISION" },
            transaction: t
        });
        if (!estadoRevision) throw new Error("No se encontró el estado REVISION.");

        await proyecto.Idea.update(
            { id_estado: estadoRevision.id_estado },
            { transaction: t }
        );

        // Registrar en historial
        await HistorialProyecto.create(
            {
                id_proyecto: idProyecto,
                id_estado: estadoRevision.id_estado,
                codigo_usuario,
                observacion: `El proyecto fue continuado por el usuario ${codigo_usuario}. La idea asociada pasó a estado REVISION.`,
                fecha: new Date()
            },
            { transaction: t }
        );

        await t.commit();

        return {
            message: "Proyecto continuado correctamente. La idea pasó a estado STAND_BY.",
            proyecto
        };
    } catch (error) {
        await t.rollback();
        throw new Error("Error al continuar proyecto: " + error.message);
    }
}

async function obtenerProyectosContinuables(codigo_usuario) {
    try {
        const estadoCalificado = await Estado.findOne({
            where: { descripcion: "CALIFICADO" }
        });
        const estadoAprobado = await Estado.findOne({
            where: { descripcion: "APROBADO" }
        });

        if (!estadoCalificado || !estadoAprobado) {
            throw new Error("No se encontraron los estados requeridos (CALIFICADO y/o APROBADO).");
        }

        const proyectos = await Proyecto.findAll({
            where: { id_estado: estadoCalificado.id_estado },
            include: [
                {
                    model: Idea,
                    as: "Idea",
                    where: {
                        id_estado: estadoAprobado.id_estado,
                        codigo_usuario
                    },
                    attributes: ["id_idea", "titulo", "id_estado"]
                }
            ],
            attributes: [
                "id_proyecto",
                "linea_investigacion",
                "tecnologias",
                "palabras_clave",
                "id_estado"
            ],
            order: [["id_proyecto", "DESC"]]
        });

        return proyectos;
    } catch (error) {
        throw new Error("Error al listar proyectos continuables: " + error.message);
    }
}

async function verDetalleProyecto(idProyecto){
   
  if (!idProyecto || isNaN(idProyecto)) {
    throw new Error("El id no es válido");
  }
  try {
    const proyectoBuscado = await Proyecto.findOne({
        where: { id_proyecto: idProyecto },
        attributes: ['id_proyecto', 'linea_investigacion', 'tecnologias', 'palabras_clave', 'fecha_creacion'],
        include: [{
            model: HistorialProyecto, 
            attributes: ['id_historial_proyecto', 'fecha'], 
            include: [{
                model: Estado,
                attributes: ['descripcion']
            }, {
                model: Equipo, 
                attributes: ['id_equipo'],
                include: [{
                    model: IntegrantesEquipo, 
                    attributes: ['rol_equipo'], 
                    include: [{
                        model: Usuario, 
                        attributes: ['nombre', 'codigo']
                    }]
                }]
            }]

        }, 
        {
            model: TipoAlcance,
            attributes: ['nombre']
            },
            {
            model: Idea,
            attributes: ['titulo', 'objetivo_general']
        }, {
            model: Entregable, 
            attributes: ['tipo', 'nombre_archivo', 'url_archivo', 'fecha_subida'], 
            include: [{
                model: Estado, 
                attributes: ['descripcion']
            }]
        }
        ]
    });
    if (!proyectoBuscado) {
      throw new Error("Proyecto no encontrado");
    }
    return proyectoBuscado;
  } catch (error) {
    throw new Error("Error al obtener la materia " + error.message);
  }
} 

async function generarHistorialProyecto(idProyecto){
   
      if (!idProyecto || isNaN(idProyecto)) {
        throw new Error("El id no es válido");
      }
      try {
        const proyectoBuscado = await Proyecto.findOne({
            where: { id_proyecto: idProyecto },
            attributes: ['id_proyecto', 'linea_investigacion', 'tecnologias', 'palabras_clave', 'fecha_creacion'],
            include: [
                {
                    model: TipoAlcance,
                    attributes: ['nombre']
                },
                {
                    model: Idea,
                    attributes: ['titulo', 'objetivo_general']
                },{
                    model: HistorialProyecto, 
                    attributes: ['id_historial_proyecto', 'fecha'], 
                    include: [{
                        model: Estado,
                        attributes: ['descripcion']
                    }]
                    
                }, {
                    model: Entregable, 
                    attributes: ['id_entregable','nombre_archivo', 'fecha_subida'], 
                    include: [{
                        model: Actividad, 
                        attributes: ['titulo']
                    }]
                }
            ]
        });
    
        if (!proyectoBuscado) {
          throw new Error("Proyecto no encontrado");
        }
        return proyectoBuscado;
      } catch (error) {
        throw new Error("Error al obtener la materia " + error.message);
      }
}

async function calcularAvanceProyecto(idProyecto) {
    if (!idProyecto || isNaN(idProyecto)) {
        throw new Error("El id no es válido");
      }
    try {
        const proyecto = await Proyecto.findOne({
            where: { id_proyecto: idProyecto },
            attributes: ['id_tipo_alcance'],
            include: [{
                model: Entregable, 
                attributes: ['tipo']
            }]
        });
        let porcentaje = 0;
        if(proyecto.id_tipo_alcance == 2){
            const tipos = proyecto.entregables.map(e => e.tipo.toUpperCase());
            const tieneRepositorio = tipos.includes("REPOSITORIO");
            const tieneVideo = tipos.includes("VIDEO");

            if (tieneRepositorio && tieneVideo) {
                porcentaje = 100;
            } else if (tieneRepositorio || tieneVideo) {
                porcentaje = 50;
            } else {
                porcentaje = 0;
            };

        }else if(proyecto.id_tipo_alcance == 1){
            const tipos = proyecto.entregables.map(e => e.tipo.toUpperCase());
            const tieneDocumento = tipos.includes("DOCUMENTO");
            if(tieneDocumento){
                porcentaje=100
            }
        }
        return porcentaje;
    } catch (error) {
        throw new Error("Error al obtener el proyecto " + error.message);
    }
}
export default {
    crearProyectoDesdeIdea,
    obtenerProyectoPorId,
    actualizarProyecto,
    liberarProyecto,
    revisarProyecto,
    listarPropuestasLibres,
    adoptarPropuesta,
    continuarProyecto,
    calificarProyecto,
    obtenerProyectosContinuables,
    listarProyectosDirector,
    listarTodosProyectosDeUnEstudiante,
    listarTodosProyectosDeUnProfesor,
    listarTodosProyectosDeUnGrupo, 
    verDetalleProyecto, 
    generarHistorialProyecto,
    calcularAvanceProyecto

};
