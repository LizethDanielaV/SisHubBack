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
import Entregable from "../models/Entregable.js";
import Esquema from "../models/Esquema.js";
import IntegranteEquipo from "../models/IntegrantesEquipo.js";
import db from "../db/db.js";
import { Op } from "sequelize";

function construirJerarquiaItems(items) {
    const itemsMap = new Map();
    const raices = [];

    // Crear mapa de items
    items.forEach(item => {
        itemsMap.set(item.id_item, {
            id_item: item.id_item,
            nombre: item.nombre,
            super_item: item.super_item,
            hijos: []
        });
    });

    // Construir jerarquía
    items.forEach(item => {
        const nodo = itemsMap.get(item.id_item);

        if (item.super_item === null) {
            raices.push(nodo);
        } else {
            const padre = itemsMap.get(item.super_item);
            if (padre) {
                padre.hijos.push(nodo);
            }
        }
    });

    return raices;
}

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

        // Obtener el esquema del tipo de alcance
        const esquemas = actividad.Tipo_alcance.Esquemas;

        if (!esquemas || esquemas.length === 0) {
            throw new Error("El tipo de alcance no tiene esquemas asociados");
        }

        // Tomar el primer esquema (o puedes agregar lógica para seleccionar uno específico)
        const esquemaSeleccionado = esquemas[0];

        // Obtener TODOS los ítems del esquema completo
        const itemsEsquema = await Item.findAll({
            where: { id_esquema: esquemaSeleccionado.id_esquema },
            attributes: ["id_item", "nombre", "super_item", "id_esquema"],
            order: [["id_item", "ASC"]]
        });

        if (!itemsEsquema || itemsEsquema.length === 0) {
            throw new Error("El esquema no tiene ítems definidos");
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
            id_tipo_alcance: actividad.id_tipo_alcance
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
            observacion: `Proyecto creado a partir de la idea aprobada "${idea.titulo}". Tipo de alcance: ${actividad.Tipo_alcance.nombre}. Esquema adoptado: ${esquemaSeleccionado.id_esquema} con ${itemsEsquema.length} ítems.`
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
                        "codigo_usuario"
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

        // Construir estructura jerárquica de ítems (padres e hijos)
        const itemsJerarquicos = construirJerarquiaItems(itemsEsquema);

        return {
            ...proyectoCompleto.toJSON(),
            equipo: equipo ? {
                id_equipo: equipo.id_equipo,
                descripcion: equipo.descripcion
            } : null,
            esquema_adoptado: {
                id_esquema: esquemaSeleccionado.id_esquema,
                ubicacion: esquemaSeleccionado.ubicacion,
                total_items: itemsEsquema.length,
                items: itemsEsquema.map(item => ({
                    id_item: item.id_item,
                    nombre: item.nombre,
                    super_item: item.super_item,
                    id_esquema: item.id_esquema
                })),
                items_jerarquicos: itemsJerarquicos
            },
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

    // ===== LÓGICA PARA OBTENER EL ESQUEMA =====
    let esquemaInfo = null;
    let actividadReferencia = null;

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

    let esquemaCompleto = null;

    if (actividadReferencia && actividadReferencia.Tipo_alcance) {
        const esquemas = actividadReferencia.Tipo_alcance.Esquemas;

        if (esquemas && esquemas.length > 0) {
            const esquemaSeleccionado = esquemas[0];

            const itemsEsquema = await Item.findAll({
                where: { id_esquema: esquemaSeleccionado.id_esquema },
                attributes: ["id_item", "nombre", "super_item", "id_esquema"],
                order: [["id_item", "ASC"]]
            });

            if (itemsEsquema && itemsEsquema.length > 0) {
                // Construir jerarquía
                const itemsJerarquicos = construirJerarquiaItems(itemsEsquema);

                esquemaCompleto = {
                    ...esquemaInfo,
                    id_esquema: esquemaSeleccionado.id_esquema,
                    ubicacion: esquemaSeleccionado.ubicacion,
                    tipo_alcance: actividadReferencia.Tipo_alcance.nombre,
                    actividad: {
                        id_actividad: actividadReferencia.id_actividad,
                        titulo: actividadReferencia.titulo,
                        grupo: {
                            codigo_materia: actividadReferencia.codigo_materia,
                            nombre: actividadReferencia.nombre,
                            periodo: actividadReferencia.periodo,
                            anio: actividadReferencia.anio
                        }
                    },
                    total_items: itemsEsquema.length,
                    items: itemsEsquema.map(item => ({
                        id_item: item.id_item,
                        nombre: item.nombre,
                        super_item: item.super_item,
                        id_esquema: item.id_esquema
                    })),
                    items_jerarquicos: itemsJerarquicos
                };
            }
        }
    }

    return {
        ...proyecto.toJSON(),
        equipo: equipo ? equipo.toJSON() : null,
        historial,
        esquema_actual: esquemaCompleto
    };
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

async function listarProyectosDirector() {
    try {
        const proyectos = await Proyecto.findAll({
            attributes: ['codigo', 'nombre', 'semestre'],
            include: [{
                model: TipoAlcance,
                attributes: ['nombre']
            }, {
                model: Idea,
                attributes: ['objetivo_general']
            }],
        });
        return proyectos;
    } catch (error) {
        throw new Error("Error al obtener los proyectos " + error.message);
    }
}

async function revisarProyecto(id_proyecto, accion, observacion, codigo_usuario) {
    const transaction = await db.transaction();
    try {
        if (!codigo_usuario) throw new Error("Debe especificar el código del usuario que realiza la revisión.");

        const accionesValidas = ["Aprobar", "Aprobar_Con_Observacion", "Rechazar"];
        if (!accionesValidas.includes(accion)) throw new Error("Acción no válida.");

        const proyecto = await Proyecto.findByPk(id_proyecto, { include: [{ model: Idea }], transaction });
        if (!proyecto) throw new Error("Proyecto no encontrado.");

        // 3️⃣ Determinar estado y mensaje
        let nuevoEstado, mensaje, idEquipoHistorial = null, lider;


        const equiposDelGrupo = await Equipo.findAll({
            where: {
                codigo_materia: proyecto.Idea.codigo_materia,
                nombre: proyecto.Idea.nombre,
                periodo: proyecto.Idea.periodo,
                anio: proyecto.Idea.anio
            },
            attributes: ['id_equipo']
        });

        const idsEquipos = equiposDelGrupo.map(e => e.id_equipo);

        if (idsEquipos.length > 0) {
            lider = await IntegranteEquipo.findOne({
                where: {
                    codigo_usuario: proyecto.Idea.codigo_usuario,
                    es_lider: true,
                    id_equipo: { [Op.in]: idsEquipos },
                },
                include: [{ model: Equipo }],
                transaction
            });
        }

        switch (accion) {
            case "Aprobar":
                nuevoEstado = await Estado.findOne({ where: { descripcion: "APROBADO" }, transaction });
                mensaje = "Proyecto aprobado sin observaciones.";
                break;

            case "Aprobar_Con_Observacion":
                nuevoEstado = await Estado.findOne({ where: { descripcion: "STAND_BY" }, transaction });
                mensaje = "Proyecto aprobado con observaciones.";
                break;

            case "Rechazar":
                nuevoEstado = await Estado.findOne({ where: { descripcion: "RECHAZADO" }, transaction });
                mensaje = "Proyecto rechazado. El equipo deberá presentar una nueva propuesta.";

                // Desactivar el equipo asociado al proyecto
                if (lider && lider.equipo) {
                    lider.equipo.estado = false;
                    await lider.equipo.save({ transaction });
                    idEquipoHistorial = lider.equipo.id_equipo;
                } else {
                    console.warn("No se encontró líder o equipo asociado para desactivar.");
                }

                proyecto.Idea.codigo_materia = null;
                proyecto.Idea.nombre = null;
                proyecto.Idea.periodo = null;
                proyecto.Idea.anio = null;
                await proyecto.Idea.save({ transaction });

                break;
        }

        if (!nuevoEstado) throw new Error("No se encontró el estado correspondiente.");

        // 4️⃣ Actualizar el proyecto
        proyecto.id_estado = nuevoEstado.id_estado;
        await proyecto.save({ transaction });

        if (proyecto.Idea) {
            proyecto.Idea.id_estado = nuevoEstado.id_estado;
            await proyecto.Idea.save({ transaction });
        }

        if (!idEquipoHistorial && lider?.equipo) {
            idEquipoHistorial = lider.equipo.id_equipo;
        }

        // 5️⃣ Registrar en historial
        const textoObservacion = observacion
            ? `${mensaje} Observaciones: ${observacion}`
            : mensaje;

        await HistorialProyecto.create(
            {
                fecha: new Date(),
                observacion: textoObservacion,
                id_estado: nuevoEstado.id_estado,
                id_proyecto,
                codigo_usuario,
                id_equipo: idEquipoHistorial
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
            attributes: ["id_estado"]
        });

        if (!estadoLibre) {
            throw new Error("No se encontró el estado 'LIBRE'");
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
                "anio"
            ],
            include: [
                {
                    model: Estado,
                    as: "Estado",
                    attributes: ["descripcion"]
                },
                {
                    model: Proyecto,
                    as: "proyectos", // 👈 alias correcto según tu relación
                    attributes: ["id_proyecto"],
                    required: true
                }
            ],
            order: [["id_idea", "DESC"]]
        });

        return propuestasLibres;
    } catch (error) {
        console.error("Error al listar propuestas LIBRES:", error);
        throw new Error("No fue posible listar las propuestas con estado LIBRE y proyecto asociado");
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

        const estadoStandBy = await Estado.findOne({
            where: { descripcion: "STAND_BY" },
            transaction: t
        });
        if (!estadoStandBy) throw new Error("No se encontró el estado STAND_BY");

        const equipoExistente = await Equipo.findOne({
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
                    where: { codigo_usuario, es_lider: true },
                    required: false
                }
            ],
            transaction: t
        });

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

        await HistorialProyecto.create(
            {
                id_proyecto,
                id_estado: estadoStandBy.id_estado,
                codigo_usuario,
                observacion: `El líder ${codigo_usuario} adoptó la propuesta del banco de proyectos.`,
                fecha: new Date(),
                id_equipo: equipoAsociado.id_equipo
            },
            { transaction: t }
        );

        await t.commit();

        return {
            message: "Propuesta adoptada correctamente",
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
    // Implementación pendiente
}

async function listarProyectosParaContinuar() {
    // Implementación pendiente
}
export default {
    crearProyectoDesdeIdea,
    obtenerProyectoPorId,
    actualizarProyecto,
    liberarProyecto,
    listarProyectosDirector,
    revisarProyecto,
    listarPropuestasLibres,
    adoptarPropuesta,
    continuarProyecto,
    listarProyectosParaContinuar    
};

