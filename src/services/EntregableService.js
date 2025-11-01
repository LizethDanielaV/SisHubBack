import Entregable from "../models/Entregable.js";
import Equipo from "../models/Equipo.js";
import Actividad from "../models/Actividad.js";
import Proyecto from "../models/Proyecto.js";
import Idea from "../models/Idea.js";
import Estado from "../models/Estado.js";
import HistorialEntregable from "../models/HistorialEntregable.js";
import db from "../db/db.js";

async function listarEntregablesPorActividad(id_actividad) {
    try {
        // Validar que la actividad exista
        const actividad = await Actividad.findByPk(id_actividad);
        if (!actividad) throw new Error("Actividad no encontrada");

        // Buscar entregables asociados a esa actividad
        const entregables = await Entregable.findAll({
            where: { id_actividad },
            include: [
                {
                    model: Equipo,
                    attributes: ["id_equipo", "descripcion", "estado"]
                },
                {
                    model: Proyecto,
                    attributes: ["linea_investigacion", "tecnologias", "palabras_clave"],
                    include: [{
                        model: Idea,
                        attributes: ["titulo", "problema", "justificacion", "objetivo_general", "objetivos_especificos"]
                    }]
                },
                {
                    model: Estado,
                    attributes: ["id_estado", "descripcion"]
                }
            ],
            attributes: ["id_entregable", "tipo", "nombre_archivo", "url_archivo", "comentarios", "fecha_subida", "calificacion"]
        });

        if (entregables.length === 0)
            return { message: "No hay entregables registrados para esta actividad." };

        return entregables;
    } catch (error) {
        throw new Error("Error al listar entregables por actividad: " + error.message);
    }
}

async function retroalimentarEntregable(id_entregable, comentarios, calificacion, codigo_usuario) {
    const transaction = await db.transaction();
    try {
        if (!codigo_usuario) {
            throw new Error("Debe especificar el código del usuario que realiza la retroalimentación.");
        }
        // Validar que el entregable exista
        const entregable = await Entregable.findByPk(id_entregable, { transaction });
        if (!entregable) throw new Error("Entregable no encontrado");

        // Validar calificación opcional (si se envía)
        if (calificacion !== undefined && (calificacion < 0 || calificacion > 5)) {
            throw new Error("La calificación debe estar entre 0 y 5");
        }

        // Actualizar entregable con la retroalimentación del docente
        entregable.comentarios = comentarios || "Sin comentarios";
        if (calificacion !== undefined) entregable.calificacion = calificacion;

        // Cambiar su estado a 'REVISADO'
        const estadoRevisado = await Estado.findOne({
            where: { descripcion: "CALIFICADO" },
            transaction
        });
        if (!estadoRevisado) throw new Error("No se encontró el estado 'CALIFICADO'.");

        entregable.id_estado = estadoRevisado.id_estado;
        await entregable.save({ transaction });

        let observacion_historial = comentarios || "Sin observaciones";
        let mensaje = `El docente ha calificado el entregable. Calificación: ${calificacion !== undefined ? calificacion : "No asignada"} y en observaciones: ${observacion_historial}.`;
        await HistorialEntregable.create({
            fecha: new Date(),
            observacion: mensaje,
            calificacion: calificacion ?? null,
            id_estado: estadoRevisado.id_estado,
            id_entregable,
            codigo_usuario
        }, { transaction });

        await transaction.commit();
        return { message: "Retroalimentación registrada exitosamente.", entregable };
    } catch (error) {
        await transaction.rollback();
        throw new Error("Error al registrar retroalimentación: " + error.message);
    }
}

export default { listarEntregablesPorActividad, retroalimentarEntregable };
