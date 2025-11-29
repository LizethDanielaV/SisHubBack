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
import Item from "../models/Item.js";
import MensajeService from "./MensajeService.js";
import NotificacionService from "./NotificacionService.js";
import nodemailer from 'nodemailer';

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

        const integrante = await IntegranteEquipo.findOne({
            where: { codigo_usuario },
            include: [{ model: Equipo, as: "equipo" }]
        });

        if (!integrante || !integrante.equipo) {
            throw new Error("El usuario no pertenece a ningún equipo válido para esta idea.");
        }

        const equipo = integrante.equipo;

        // Registrar en historial
        await HistorialProyecto.create({
            id_proyecto: nuevoProyecto.id_proyecto,
            id_estado: idea.id_estado,
            codigo_usuario: codigo_usuario,
            id_equipo: equipo.id_equipo,
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
            where: {
                id_estado: { [Op.ne]: 13 }
            },
            include: [
                {
                    model: TipoAlcance,
                    attributes: ['nombre']
                },
                {
                    model: Idea,
                    attributes: ['objetivo_general', 'titulo']
                },
                {
                    model: Estado,
                    attributes: ['descripcion']
                }
            ]
        });

        // 🔹 Calcular los porcentajes en paralelo
        const porcentajesPromises = proyectos.map(p =>
            calcularAvanceProyecto(p.id_proyecto).catch(error => {
                console.error(`Error calculando porcentaje del proyecto ${p.id_proyecto}:`, error.message);
                return 0;
            })
        );

        const porcentajes = await Promise.all(porcentajesPromises);

        // 🔹 Agregar el porcentaje directamente a cada objeto
        const proyectosConPorcentaje = proyectos.map((proyecto, index) => {
            const plainProyecto = proyecto.get({ plain: true });
            return {
                ...plainProyecto,
                porcentaje: porcentajes[index]
            };
        });

        return proyectosConPorcentaje;

    } catch (error) {
        throw new Error("Error al obtener los proyectos del director: " + error.message);
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
                    attributes: ['titulo', 'objetivo_general'],
                    include: [
                        {
                            model: Estado,
                            attributes: ['descripcion']
                        }
                    ]
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
                            include: [
                                {
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
                            attributes: ['id_equipo', 'estado'], // Agregar estado para debugging
                            where: { estado: true }, // Solo equipos activos
                            include: [
                                {
                                    model: IntegrantesEquipo,
                                    required: true,
                                    attributes: [],
                                    include: [
                                        {
                                            model: Usuario,
                                            attributes: ['codigo'],
                                            where: { codigo: codigoEstudiante },
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

        console.log(`🔍 Proyectos encontrados ANTES de filtros: ${proyectos.length}`);
        proyectos.forEach(p => {
            const historiales = p.Historial_Proyectos || [];
            console.log(`  - Proyecto ${p.id_proyecto}: ${p.Idea?.titulo} | Estado idea: ${p.Idea?.Estado?.descripcion} | ${historiales.length} historiales`);
            historiales.forEach((h, idx) => {
                console.log(`    Historial ${idx}: equipo ${h.equipo?.id_equipo} estado ${h.equipo?.estado}`);
            });
        });

        // Filtrar proyectos con ideas que NO estén en estado LIBRE
        const proyectosFiltrados = proyectos.filter(p => {
            const estadoIdea = p.Idea?.Estado?.descripcion;
            return estadoIdea !== 'LIBRE';
        });

        console.log(`🔍 Proyectos DESPUÉS de filtrar LIBRE: ${proyectosFiltrados.length}`);
        proyectosFiltrados.forEach(p => {
            console.log(`  - Proyecto ${p.id_proyecto}: ${p.Idea?.titulo} | Estado: ${p.Idea?.Estado?.descripcion}`);
        });

        // Calcular porcentajes en paralelo para proyectos filtrados
        const porcentajesPromises = proyectosFiltrados.map(p =>
            calcularAvanceProyecto(p.id_proyecto).catch(error => {
                console.error(`Error calculando porcentaje proyecto ${p.id_proyecto}:`, error.message);
                return 0; // Si falla, devolver 0
            })
        );

        const porcentajes = await Promise.all(porcentajesPromises);

        // 🔹 Agregar porcentaje a cada proyecto filtrado, sin perder datos ni includes
        const proyectosConPorcentaje = proyectosFiltrados.map((proyecto, index) => {
            const plainProyecto = proyecto.get({ plain: true }); // convertir a objeto plano
            return {
                ...plainProyecto,
                porcentaje: porcentajes[index]
            };
        });

        return proyectosConPorcentaje;

    } catch (error) {
        throw new Error("Error al obtener los proyectos del estudiante: " + error.message);
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

        // Calcular porcentajes en paralelo para mejor rendimiento
        const porcentajesPromises = proyectos.map(p =>
            calcularAvanceProyecto(p.id_proyecto).catch(error => {
                console.error(`Error calculando porcentaje proyecto ${p.id_proyecto}:`, error.message);
                return 0; // Retornar 0 si hay error
            })
        );

        const porcentajes = await Promise.all(porcentajesPromises);

        const resultado = proyectos.map((proyecto, index) => {
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
                porcentaje: porcentajes[index],
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
        // 🔹 Buscar los proyectos asociados al grupo
        const proyectos = await Proyecto.findAll({
            attributes: [
                "id_proyecto",
                "linea_investigacion",
                "tecnologias",
                "fecha_creacion"
            ],
            include: [
                {
                    model: TipoAlcance,
                    attributes: ["nombre"]
                },
                {
                    model: Estado,
                    attributes: ["descripcion"],
                    as: "Estado"
                },
                {
                    model: Idea,
                    attributes: [
                        "titulo",
                        "objetivo_general",
                        "codigo_materia",
                        "nombre",
                        "periodo",
                        "anio"
                    ],
                    where: {
                        codigo_materia: codigoMateria,
                        nombre,
                        periodo,
                        anio
                    },
                    include: [
                        {
                            model: Estado,
                            as: "Estado",
                            attributes: ["descripcion"]
                        }
                    ],
                    required: true
                }
            ]
        });

        // 🔹 Buscar la actividad del grupo junto con su tipo de alcance
        const actividad = await Actividad.findOne({
            where: { codigo_materia: codigoMateria, nombre, periodo, anio },
            attributes: ["id_actividad"],
            include: [
                {
                    model: TipoAlcance,
                    attributes: ["nombre"]
                }
            ]
        });
        // Calcular porcentajes en paralelo para mejor rendimiento
        const porcentajesPromises = proyectos.map(p =>
            calcularAvanceProyecto(p.id_proyecto).catch(error => {
                console.error(`Error calculando porcentaje proyecto ${p.id_proyecto}:`, error.message);
                return 0; // Retornar 0 si hay error
            })
        );

        const porcentajes = await Promise.all(porcentajesPromises);

        // 🔹 Formato de salida
        const resultado = proyectos.map((p, index) => ({
            id_proyecto: p.id_proyecto,
            linea_investigacion: p.linea_investigacion,
            tecnologias: p.tecnologias,
            fecha_creacion: p.fecha_creacion,
            estado: p.Estado?.descripcion || null, // Estado del proyecto
            id_actividad: actividad?.id_actividad || null, // 👈 id_actividad del grupo
            tipo_alcance: actividad?.Tipo_alcance?.nombre || null, // 👈 nombre del tipo de alcance
            porcentaje: porcentajes[index],
            Idea: {
                titulo: p.Idea?.titulo,
                objetivo_general: p.Idea?.objetivo_general,
                codigo_materia: p.Idea?.codigo_materia,
                nombre: p.Idea?.nombre,
                periodo: p.Idea?.periodo,
                anio: p.Idea?.anio,
                estado: p.Idea?.Estado?.descripcion || null // Estado de la idea
            }
        }));

        return resultado;
    } catch (error) {
        console.error("Error al obtener los proyectos filtrados por grupo:", error);
        throw new Error("Error al obtener los proyectos: " + error.message);
    }
}

export async function createDataProject(data) {
    try {
        const {
            fecha_creacion,
            linea_investigacion,
            tecnologias,
            id_tipo_alcance
        } = data;

        const nuevoProyecto = await Proyecto.create({
            fecha_creacion: fecha_creacion,
            linea_investigacion: linea_investigacion || null,
            tecnologias: tecnologias || null,
            id_tipo_alcance: id_tipo_alcance || null,
            palabras_clave: null,
            id_idea: null,
            id_estado: 13
        });

        return nuevoProyecto;

    } catch (error) {
        throw new Error("Error al crear el proyecto: " + error.message);
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
        console.log(proyecto.Idea);
        
        // Buscar estado "CALIFICADO"
        const estadoCalificado = await Estado.findOne({
            where: { descripcion: "CALIFICADO" },
            transaction
        });
        if (!estadoCalificado) throw new Error("No existe el estado 'CALIFICADO' en la tabla Estado.");

        // Buscar estado "APROBADO"
        const estadoAprobado = await Estado.findOne({
            where: { descripcion: "APROBADO" },
            transaction
        });
        if (!estadoCalificado) throw new Error("No existe el estado 'CALIFICADO' en la tabla Estado.");

        // Actualizar estado del proyecto e idea
        proyecto.id_estado = estadoCalificado.id_estado;
        await proyecto.save({ transaction });

        if (proyecto.Idea) {
            proyecto.Idea.id_estado = estadoAprobado.id_estado;
            await proyecto.Idea.save({ transaction });
        }

        console.log(proyecto);

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
        console.log(equipo);

        // Registrar en historial
        const historialProyecto = await HistorialProyecto.create({
            fecha: new Date(),
            observacion: observacion
                ? `Proyecto calificado. Observaciones: ${observacion}`
                : "Proyecto calificado sin observaciones.",
            id_estado: estadoCalificado.id_estado,
            id_proyecto,
            codigo_usuario,
            id_equipo: equipo ? equipo.id_equipo : null
        }, { transaction });


        //generar notificacion a integrantes del equipo
        const mensaje = await MensajeService.crearMensaje(`Calificacion de proyecto: ${proyecto.Idea.titulo}`, `Se ha registrado la calificacion de su proyecto con la siguiente observación: ${historialProyecto.observacion}`);
        console.log("aquiiii" + equipo.id_equipo);
        //obtener integrantes del equipo 
        // Obtener integrantes del equipo con sus datos de usuario (incluyendo correo)
        const integrantes = await IntegranteEquipo.findAll({
            where: { id_equipo: equipo.id_equipo },
            include: [{
                model: Usuario,
                attributes: ['codigo', 'correo', 'nombre']
            }],
            transaction
        });


        if (mensaje && mensaje.id_mensaje && integrantes.length > 0) {
            // Crear notificaciones y enviar correos
            await Promise.all(
                integrantes.map(async (integrante) => {
                    // Crear notificación en el sistema
                    await NotificacionService.crearNotificacion(
                        integrante.codigo_usuario,
                        mensaje.id_mensaje
                    );

                    // Enviar correo electrónico
                    if (integrante.Usuario && integrante.Usuario.correo) {
                        await enviarCorreoCalificacion({
                            destinatario: integrante.Usuario.correo,
                            nombreDestinatario: integrante.Usuario.nombre,
                            tituloProyecto: proyecto.Idea.titulo,
                            observacion: historialProyecto.observacion
                        });
                    }
                })
            );
        }
        await transaction.commit();

       return { message: "Proyecto calificado exitosamente.", proyecto };
      
    } catch (error) {
        await transaction.rollback();
        throw new Error("Error al calificar el proyecto: " + error.message);
    }
}

// Función auxiliar para enviar correos
async function enviarCorreoCalificacion({ destinatario, nombreDestinatario, tituloProyecto, observacion }) {
    try {
        // Aquí implementas tu lógica de envío de correos
        // Ejemplo con nodemailer:
        const transporter = nodemailer.createTransport({
            // Tu configuración SMTP
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            secure: true,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });

        const mailOptions = {
            from: process.env.SMTP_FROM,
            to: destinatario,
            subject: `Calificación de proyecto: ${tituloProyecto}`,
            html: `
                <h2>Hola ${nombreDestinatario},</h2>
                <p>Se ha registrado la calificación de tu proyecto: <strong>${tituloProyecto}</strong></p>
                <p><strong>Observación:</strong></p>
                <p>${observacion}</p>
                <br>
                <p>Saludos,</p>
                <p>Sistema de Gestión de Proyectos</p>
            `
        };

        await transporter.sendMail(mailOptions);
        console.log(`Correo enviado exitosamente a: ${destinatario}`);
    } catch (error) {
        console.error(`Error al enviar correo a ${destinatario}:`, error.message);
        // No lanzamos el error para que no afecte la transacción principal
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
            include: [{ model: Idea }, { model: Estado }],
            transaction,
        });

        if (!proyecto) throw new Error("Proyecto no encontrado.");

        let nuevoEstadoProyecto = null;
        let nuevoEstadoIdea = null;
        let mensaje = "";
        let idEquipoHistorial = null;
        let lider = null;

        // 🔹 Buscar equipos relacionados al grupo del proyecto
        const equiposDelGrupo = await Equipo.findAll({
            where: {
                codigo_materia: proyecto.Idea.codigo_materia,
                nombre: proyecto.Idea.nombre,
                periodo: proyecto.Idea.periodo,
                anio: proyecto.Idea.anio,
            },
            attributes: ["id_equipo"],
            transaction,
        });

        const idsEquipos = equiposDelGrupo.map((e) => e.id_equipo);

        if (idsEquipos.length > 0) {
            lider = await IntegranteEquipo.findOne({
                where: {
                    codigo_usuario: proyecto.Idea.codigo_usuario,
                    es_lider: true,
                    id_equipo: { [Op.in]: idsEquipos },
                },
                include: [{ model: Equipo, as: "equipo" }],
                transaction,
            });
        }

        // 🔹 Estados de referencia
        const [
            estadoEnCurso,
            estadoStandBy,
            estadoRechazado,
            estadoCalificado,
            estadoLibre,
            estadoAprobada,
        ] = await Promise.all([
            Estado.findOne({ where: { descripcion: "EN_CURSO" }, transaction }),
            Estado.findOne({ where: { descripcion: "STAND_BY" }, transaction }),
            Estado.findOne({ where: { descripcion: "RECHAZADO" }, transaction }),
            Estado.findOne({ where: { descripcion: "CALIFICADO" }, transaction }),
            Estado.findOne({ where: { descripcion: "LIBRE" }, transaction }),
            Estado.findOne({ where: { descripcion: "APROBADO" }, transaction }),
        ]);

        if (!estadoEnCurso || !estadoStandBy || !estadoRechazado || !estadoCalificado || !estadoLibre || !estadoAprobada) {
            throw new Error("No se encontraron todos los estados requeridos en la base de datos.");
        }

        // 🔁 Lógica principal
        switch (accion) {
            case "Aprobar":
                nuevoEstadoProyecto = estadoEnCurso;
                nuevoEstadoIdea = estadoAprobada;
                mensaje = "Proyecto aprobado sin observaciones.";
                break;

            case "Aprobar_Con_Observacion":
                nuevoEstadoProyecto = proyecto.Estado || estadoEnCurso;
                nuevoEstadoIdea = estadoStandBy;
                mensaje = "Proyecto aprobado con observaciones.";
                break;

            case "Rechazar":
                nuevoEstadoProyecto = estadoCalificado;

                if (proyecto.Estado?.descripcion === "CALIFICADO") {
                    nuevoEstadoIdea = estadoAprobada;
                } else {
                    nuevoEstadoIdea = estadoLibre;
                }

                // 🔹 Eliminar equipos e integrantes asociados
                if (idsEquipos.length > 0) {
                    await IntegranteEquipo.destroy({
                        where: { id_equipo: { [Op.in]: idsEquipos } },
                        transaction,
                    });

                    await Equipo.destroy({
                        where: { id_equipo: { [Op.in]: idsEquipos } },
                        transaction,
                    });
                }

                // 🔹 Liberar la idea (grupo en null)
                Object.assign(proyecto.Idea, {
                    codigo_materia: null,
                    nombre: null,
                    periodo: null,
                    anio: null,
                });
                await proyecto.Idea.save({ transaction });

                mensaje = "Proyecto rechazado. El equipo y sus integrantes fueron eliminados, y la idea liberada.";
                break;
        }

        // ✅ Validación antes de asignar los estados
        if (!nuevoEstadoProyecto?.id_estado)
            throw new Error("No se pudo determinar el nuevo estado del proyecto.");
        if (!nuevoEstadoIdea?.id_estado)
            throw new Error("No se pudo determinar el nuevo estado de la idea.");

        // 🔹 Actualizar estados
        proyecto.id_estado = nuevoEstadoProyecto.id_estado;
        await proyecto.save({ transaction });

        if (proyecto.Idea) {
            proyecto.Idea.id_estado = nuevoEstadoIdea.id_estado;
            await proyecto.Idea.save({ transaction });
        }

        if (!idEquipoHistorial && lider?.equipo) {
            idEquipoHistorial = lider.equipo.id_equipo;
        }

        // 🕓 Registrar historial (sin equipo si fue eliminado)
        const textoObservacion = observacion
            ? `${mensaje} Observaciones: ${observacion}`
            : mensaje;

        const historialData = {
            fecha: new Date(),
            observacion: textoObservacion,
            id_estado: nuevoEstadoProyecto.id_estado,
            id_proyecto,
            codigo_usuario,
        };

        // Solo asociar equipo si no fue eliminado
        if (accion !== "Rechazar" && idEquipoHistorial) {
            historialData.id_equipo = idEquipoHistorial;
        }

        await HistorialProyecto.create(historialData, { transaction });

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

async function rechazarObservacion(id_idea, id_proyecto, codigo_usuario) {
    const transaction = await db.transaction();
    try {
        if (!codigo_usuario)
            throw new Error("Debe especificar el código del usuario que realiza la revisión.");

        const idea = await Idea.findByPk(id_idea, { transaction });
        if (!idea) throw new Error("Idea no encontrada.");

        const proyecto = await Proyecto.findByPk(id_proyecto, { transaction });
        if (!proyecto) throw new Error("Proyecto no encontrado.");

        // 🔹 Buscar estados necesarios
        const estadoSeleccionado = await Estado.findOne({ where: { descripcion: "SELECCIONADO" }, transaction });
        const estadoCalificado = await Estado.findOne({ where: { descripcion: "CALIFICADO" }, transaction });
        const estadoStandBy = await Estado.findOne({ where: { descripcion: "STAND_BY" }, transaction });
        const estadoLibre = await Estado.findOne({ where: { descripcion: "LIBRE" }, transaction });
        const estadoAprobado = await Estado.findOne({ where: { descripcion: "APROBADO" }, transaction });

        if (!estadoSeleccionado || !estadoCalificado || !estadoStandBy || !estadoLibre || !estadoAprobado)
            throw new Error("No se encontraron los estados requeridos.");

        let nuevoEstadoProyecto = proyecto.id_estado;
        let nuevoEstadoIdea = idea.id_estado;
        let mensaje = "";

        // 🔁 Lógica de cambio de estados
        if (proyecto.id_estado === estadoSeleccionado.id_estado) {
            nuevoEstadoProyecto = estadoCalificado;
            if (idea.id_estado === estadoStandBy.id_estado) {
                nuevoEstadoIdea = estadoLibre;
            }
            mensaje = "Proyecto rechazado. Pasó de SELECCIONADO a CALIFICADO. La idea quedó LIBRE.";
        }
        else if (proyecto.id_estado === estadoCalificado.id_estado) {
            nuevoEstadoProyecto = estadoCalificado; // se mantiene
            if (idea.id_estado === estadoStandBy.id_estado) {
                nuevoEstadoIdea = estadoAprobado;
            }
            mensaje = "Proyecto rechazado (mantiene estado CALIFICADO). La idea pasó a APROBADO.";
        }
        else {
            mensaje = "El proyecto no se encontraba en un estado válido para rechazo.";
        }

        // 🔹 Buscar y eliminar equipos asociados al grupo de la idea (como moverIdeaAlBancoPorDecision)
        const equiposDelGrupo = await Equipo.findAll({
            where: {
                codigo_materia: idea.codigo_materia,
                nombre: idea.nombre,
                periodo: idea.periodo,
                anio: idea.anio
            },
            attributes: ['id_equipo'],
            transaction
        });

        const idsEquipos = equiposDelGrupo.map(e => e.id_equipo);

        if (idsEquipos.length > 0) {
            await IntegranteEquipo.destroy({
                where: { id_equipo: { [Op.in]: idsEquipos } },
                transaction
            });

            await Equipo.destroy({
                where: { id_equipo: { [Op.in]: idsEquipos } },
                transaction
            });
        }

        // 🔹 Actualizar proyecto
        await proyecto.update({ id_estado: nuevoEstadoProyecto.id_estado }, { transaction });

        // 🔹 Actualizar idea
        await idea.update(
            {
                id_estado: nuevoEstadoIdea.id_estado,
                codigo_materia: null,
                nombre: null,
                periodo: null,
                anio: null
            },
            { transaction }
        );

        // 🔹 Registrar historial del proyecto
        await HistorialProyecto.create({
            fecha: new Date(),
            observacion:
                "El estudiante decidió no corregir las observaciones del profesor. La idea fue liberada y el equipo eliminado.",
            id_estado: nuevoEstadoProyecto.id_estado,
            id_proyecto: proyecto.id_proyecto,
            codigo_usuario
        }, { transaction });

        await transaction.commit();

        return {
            message: mensaje + " El equipo y sus integrantes fueron eliminados correctamente.",
            proyecto,
            idea
        };

    } catch (error) {
        await transaction.rollback();
        throw new Error("Error al rechazar la observación: " + error.message);
    }
}

async function adoptarPropuesta(id_proyecto, codigo_usuario, grupo) {
    const t = await db.transaction();

    console.log("Adoptando propuesta...", id_proyecto);
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

async function continuarProyecto(idProyecto, codigo_usuario, nuevoGrupo) {
    const t = await db.transaction();
    try {
        const proyecto = await Proyecto.findByPk(idProyecto, {
            include: [{ model: Idea, as: "Idea" }],
            transaction: t
        });

        if (!proyecto) throw new Error("Proyecto no encontrado.");
        if (!proyecto.Idea) throw new Error("El proyecto no tiene idea asociada.");

        // 🔹 Verificar que el proyecto esté CALIFICADO
        const estadoCalificado = await Estado.findOne({
            where: { descripcion: "CALIFICADO" },
            transaction: t
        });
        if (!estadoCalificado)
            throw new Error("No existe el estado CALIFICADO en la tabla Estado.");

        if (proyecto.id_estado !== estadoCalificado.id_estado) {
            throw new Error("Solo se pueden continuar proyectos con estado CALIFICADO.");
        }

        // 🔹 Obtener estado REVISION
        const estadoRevision = await Estado.findOne({
            where: { descripcion: "REVISION" },
            transaction: t
        });
        if (!estadoRevision)
            throw new Error("No se encontró el estado REVISION.");

        const nuevoEquipo = await Equipo.create(
            {
                descripcion: `Equipo de ${codigo_usuario}`,
                codigo_materia: nuevoGrupo.codigo_materia,
                nombre: nuevoGrupo.nombre,
                periodo: nuevoGrupo.periodo,
                anio: nuevoGrupo.anio,
                estado: true
            },
            { transaction: t }
        );

        await IntegranteEquipo.create(
            {
                codigo_usuario,
                id_equipo: nuevoEquipo.id_equipo,
                rol_equipo: "Líder",
                es_lider: true
            },
            { transaction: t }
        );

        await proyecto.Idea.update(
            {
                id_estado: estadoRevision.id_estado,
                codigo_usuario,
                codigo_materia: nuevoGrupo.codigo_materia,
                nombre: nuevoGrupo.nombre,
                periodo: nuevoGrupo.periodo,
                anio: nuevoGrupo.anio
            },
            { transaction: t }
        );

        // 🔹 Registrar en historial
        await HistorialProyecto.create(
            {
                id_proyecto: idProyecto,
                id_estado: estadoRevision.id_estado,
                codigo_usuario,
                observacion: `El proyecto fue continuado por el usuario ${codigo_usuario}. Se creó un nuevo equipo y la idea pasó a estado REVISION.`,
                fecha: new Date(),
                id_equipo: nuevoEquipo.id_equipo
            },
            { transaction: t }
        );

        await t.commit();

        return {
            message: "Proyecto continuado correctamente. Se creó un nuevo equipo y la idea pasó a estado REVISION.",
            proyecto,
            equipo: nuevoEquipo
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
                    attributes: ["id_idea", "titulo", "id_estado", "problema", "justificacion", "objetivo_general", "objetivos_especificos"]
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

async function verDetalleProyecto(idProyecto) {

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
                attributes: ['titulo', 'problema', 'justificacion', 'objetivo_general', 'objetivos_especificos']
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

async function generarHistorialProyecto(idProyecto) {

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
                }, {
                    model: HistorialProyecto,
                    attributes: ['id_historial_proyecto', 'fecha'],
                    include: [{
                        model: Estado,
                        attributes: ['descripcion']
                    }]

                }, {
                    model: Entregable,
                    attributes: ['id_entregable', 'nombre_archivo', 'fecha_subida'],
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
        if (proyecto.id_tipo_alcance == 2) {
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

        } else if (proyecto.id_tipo_alcance == 1) {
            const tipos = proyecto.entregables.map(e => e.tipo.toUpperCase());
            const tieneDocumento = tipos.includes("DOCUMENTO");
            if (tieneDocumento) {
                porcentaje = 100
            }
        }
        return porcentaje;
    } catch (error) {
        throw new Error("Error al obtener el proyecto " + error.message);
    }
}

async function obtenerUltimoHistorialPorProyecto(id_proyecto) {
    try {
        const historial = await HistorialProyecto.findOne({
            where: { id_proyecto },
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
function getSemester(dateStr) {
    const d = new Date(dateStr);
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    const day = d.getDate();

    // Primer semestre: Feb 10 → Jun 10
    if (
        (month > 2 && month < 6) ||
        (month === 2 && day >= 10) ||
        (month === 6 && day <= 10)
    ) {
        return `${year}-1`;
    }

    // Segundo semestre: Ago 10 → Dic 10
    if (
        (month > 8 && month < 12) ||
        (month === 8 && day >= 10) ||
        (month === 12 && day <= 10)
    ) {
        return `${year}-2`;
    }

    return null;
}

async function getSemesterProjects() {
    const proyectos = await Proyecto.findAll({
        attributes: ["fecha_creacion"]
    });

    const grouped = {};

    proyectos.forEach(p => {
        const semester = getSemester(p.fecha_creacion);
        if (!semester) return;

        grouped[semester] = (grouped[semester] || 0) + 1;
    });

    return Object.entries(grouped).map(([semester, total]) => ({
        semester: semester,
        total
    }));
}

async function getSemesterByLine() {
    const proyectos = await Proyecto.findAll({
        attributes: ["fecha_creacion", "linea_investigacion"]
    });

    const grouped = {};

    proyectos.forEach(p => {
        const semester = getSemester(p.fecha_creacion);
        if (!semester) return;

        const lines = (p.linea_investigacion || "")
            .split(",")
            .map(t => t.trim())
            .filter(Boolean);

        grouped[semester] ||= {};

        lines.forEach(line => {
            grouped[semester][line] = (grouped[semester][line] || 0) + 1;
        });
    });

    const rows = [];
    for (const semester in grouped) {
        const row = { semester: semester };
        Object.entries(grouped[semester]).forEach(([line, count]) => {
            row[line] = count;
        });
        rows.push(row);
    }

    return rows;
}

async function getSemesterByScope() {
    const proyectos = await Proyecto.findAll({
        include: [
            {
                model: TipoAlcance,
                as: "Tipo_alcance",
                attributes: ["nombre"]
            }
        ],
        attributes: ["fecha_creacion"]
    });

    const grouped = {};

    proyectos.forEach(p => {
        const semester = getSemester(p.fecha_creacion);
        if (!semester) return;

        const scope = p.Tipo_alcance?.nombre || "Sin alcance";

        grouped[semester] ||= {};
        grouped[semester][scope] = (grouped[semester][scope] || 0) + 1;
    });

    const rows = [];
    for (const semester in grouped) {
        const row = { semester: semester };
        Object.entries(grouped[semester]).forEach(([scope, count]) => {
            row[scope] = count;
        });
        rows.push(row);
    }

    return rows;
}

async function getSemesterByTech() {
    const proyectos = await Proyecto.findAll({
        attributes: ["fecha_creacion", "tecnologias"]
    });

    const grouped = {};

    proyectos.forEach(p => {
        const semester = getSemester(p.fecha_creacion);
        if (!semester) return;

        const techs = (p.tecnologias || "")
            .split(",")
            .map(t => t.trim())
            .filter(Boolean);

        grouped[semester] ||= {};

        techs.forEach(tech => {
            grouped[semester][tech] = (grouped[semester][tech] || 0) + 1;
        });
    });

    const rows = [];
    for (const semester in grouped) {
        const row = { semester: semester };
        Object.entries(grouped[semester]).forEach(([tech, count]) => {
            row[tech] = count;
        });
        rows.push(row);
    }

    return rows;
}


async function exportarProyectos({ tipo, fechaInicio, fechaFin, anio, periodo }) {
    try {
        let whereProyecto = {};
        let whereEntregable = {};

        if (tipo === "fecha") {
            if (!fechaInicio || !fechaFin)
                throw new Error("Debe proporcionar fechaInicio y fechaFin");

            const [yearInicio, monthInicio, dayInicio] = fechaInicio.split('-').map(Number);
            const [yearFin, monthFin, dayFin] = fechaFin.split('-').map(Number);

            const inicio = new Date(Date.UTC(yearInicio, monthInicio - 1, dayInicio, 0, 0, 0, 0));
            const fin = new Date(Date.UTC(yearFin, monthFin - 1, dayFin, 23, 59, 59, 999));

            whereEntregable.fecha_subida = {
                [Op.between]: [inicio, fin]
            };
        }

        // Primero obtener los proyectos
        const proyectos = await Proyecto.findAll({
            where: whereProyecto,
            include: [
                {
                    model: Idea,
                    attributes: ['titulo', 'problema', 'justificacion', 'objetivo_general', 'objetivos_especificos']
                },
                {
                    model: TipoAlcance,
                    attributes: ['nombre']
                },
                {
                    model: Entregable,
                    where: tipo === "fecha" ? whereEntregable : undefined,
                    required: tipo === "fecha",
                    include: [
                        {
                            model: Equipo
                        },
                        {
                            model: Actividad,
                            include: [{ model: TipoAlcance, attributes: ["nombre"] }]
                        }
                    ]
                }
            ]
        });

        if (proyectos.length === 0) return [];

        const resultados = [];

        for (const proyecto of proyectos) {
            const idea = proyecto.Idea;

            // Filtrar entregables por semestre si es necesario
            let entregablesFiltrados = proyecto.entregables;

            if (tipo === "semestre") {
                if (!anio || !periodo)
                    throw new Error("Debe proporcionar anio y periodo");

                entregablesFiltrados = entregablesFiltrados.filter(ent => {
                    const equipo = ent.equipo;
                    return String(equipo.anio) === String(anio) &&
                        String(equipo.periodo) === String(periodo);
                });
            }

            if (entregablesFiltrados.length === 0) continue;

            // Agrupar entregables por grupo
            const gruposMap = new Map();

            for (const entregable of entregablesFiltrados) {
                const equipo = entregable.equipo;
                const grupoKey = `${equipo.codigo_materia}-${equipo.nombre}-${equipo.periodo}-${equipo.anio}`;

                if (!gruposMap.has(grupoKey)) {
                    // Buscar el grupo en la BD
                    const grupo = await Grupo.findOne({
                        where: {
                            codigo_materia: equipo.codigo_materia,
                            nombre: equipo.nombre,
                            periodo: equipo.periodo,
                            anio: equipo.anio
                        }
                    });

                    gruposMap.set(grupoKey, {
                        grupo: grupo ? `${grupo.codigo_materia}-${grupo.nombre}-${grupo.periodo}-${grupo.anio}` : grupoKey,
                        equipos: new Map()
                    });
                }

                const grupoData = gruposMap.get(grupoKey);
                const equipoKey = equipo.id_equipo;

                // Agrupar por equipo dentro del grupo
                if (!grupoData.equipos.has(equipoKey)) {
                    // Obtener integrantes del equipo
                    const integrantes = await IntegranteEquipo.findAll({
                        where: { id_equipo: equipo.id_equipo },
                        include: [{ model: Usuario }]
                    });

                    const listaIntegrantes = integrantes.map(i =>
                        `${i.Usuario.codigo} - ${i.Usuario.nombre}`
                    );

                    grupoData.equipos.set(equipoKey, {
                        equipo: listaIntegrantes.join(", "),
                        entregables: []
                    });
                }

                const equipoData = grupoData.equipos.get(equipoKey);

                // Agregar entregable con su fecha
                const fechaRaw = entregable.getDataValue('fecha_subida');
                let fechaFormateada = "Sin fecha";

                if (fechaRaw) {
                    const fecha = new Date(fechaRaw);
                    const year = fecha.getUTCFullYear();
                    const month = String(fecha.getUTCMonth() + 1).padStart(2, '0');
                    const day = String(fecha.getUTCDate()).padStart(2, '0');
                    fechaFormateada = `${year}-${month}-${day}`;
                }

                equipoData.entregables.push({
                    url: entregable.url_archivo,
                    fecha: fechaFormateada
                });
            }

            // Construir la estructura del proyecto con sus grupos
            const grupos = [];
            for (const [grupoKey, grupoData] of gruposMap) {
                const equipos = [];
                for (const [equipoKey, equipoData] of grupoData.equipos) {
                    equipos.push({
                        equipo: equipoData.equipo,
                        entregables: equipoData.entregables
                    });
                }
                grupos.push({
                    grupo: grupoData.grupo,
                    equipos: equipos
                });
            }

            resultados.push({
                titulo: idea?.titulo || "",
                problema: idea?.problema || "",
                justificacion: idea?.justificacion || "",
                objetivo_general: idea?.objetivo_general || "",
                objetivos_especificos: idea?.objetivos_especificos || "",
                linea_investigacion: proyecto.linea_investigacion || "",
                tecnologias: proyecto.tecnologias || "",
                palabras_clave: proyecto.palabras_clave || "",
                tipo_alcance: proyecto.Tipo_alcance?.nombre || "Sin tipo",
                grupos: grupos // Array de grupos, cada uno con sus equipos y entregables
            });
        }

        return resultados;

    } catch (error) {
        throw new Error("Error al exportar proyectos: " + error.message);
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
    obtenerUltimoHistorialPorProyecto,
    calcularAvanceProyecto,
    rechazarObservacion,
    getSemesterProjects,
    getSemesterByLine,
    getSemesterByScope,
    getSemesterByTech,
    createDataProject,
    exportarProyectos
};
