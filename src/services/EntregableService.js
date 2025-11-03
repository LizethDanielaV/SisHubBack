import Entregable from "../models/Entregable.js";
import fs from "fs";
import path from "path";
import Equipo from "../models/Equipo.js";
import Actividad from "../models/Actividad.js";
import Proyecto from "../models/Proyecto.js";
import Idea from "../models/Idea.js";
import Estado from "../models/Estado.js";
import HistorialEntregable from "../models/HistorialEntregable.js";
import ActividadItem from "../models/ActividadItem.js";
import Item from "../models/Item.js";
import TipoAlcance from "../models/TipoAlcance.js";
import IntegrantesEquipo from "../models/IntegrantesEquipo.js";
import HistorialProyecto from "../models/HistorialProyecto.js";
import db from "../db/db.js";
import {
    subirArchivoAFirebase,
    clonarRepositorio,
    descargarImagen,
    comprimirCarpeta,
    limpiarArchivosTemporales
} from "../utils/fileHandlers.js";

const TIPOS_ENTREGABLE = {
    DOCUMENTO: 'DOCUMENTO',
    VIDEO: 'VIDEO',
    AUDIO: 'AUDIO',
    REPOSITORIO: 'REPOSITORIO',
    IMAGEN: 'IMAGEN'
};

async function validarEquipoTieneProyecto(id_equipo) {
    const equipo = await Equipo.findByPk(id_equipo);
    if (!equipo) throw new Error("Equipo no encontrado");

    const idea = await Idea.findOne({
        where: {
            codigo_materia: equipo.codigo_materia,
            nombre: equipo.nombre,
            periodo: equipo.periodo,
            anio: equipo.anio
        }
    });

    if (!idea) throw new Error("El equipo no tiene una idea asociada");

    const proyecto = await Proyecto.findOne({
        where: { id_idea: idea.id_idea }
    });

    if (!proyecto) {
        throw new Error("El equipo no tiene un proyecto asociado. Primero debe crear un proyecto desde la idea aprobada.");
    }

    return { equipo, proyecto };
}

async function obtenerItemsRequeridos(id_actividad) {
    const itemsRequeridos = await ActividadItem.findAll({
        where: { id_actividad },
        include: [{
            model: Item,
            attributes: ['id_item', 'nombre']
        }]
    });

    return itemsRequeridos.map(ai => ai.Item.nombre.toUpperCase());
}

async function validarTipoEntregable(id_actividad, tipo) {
    const actividad = await Actividad.findByPk(id_actividad, {
        include: [{
            model: TipoAlcance,
            as: 'Tipo_alcance',
            attributes: ['nombre']
        }]
    });

    if (!actividad) throw new Error("Actividad no encontrada");

    const tipoAlcance = actividad.Tipo_alcance.nombre.toUpperCase();

    // Si es Investigativo, debe ser documento
    if (tipoAlcance === 'Investigativo' && tipo !== TIPOS_ENTREGABLE.DOCUMENTO) {
        throw new Error("Para actividades de tipo Investigativo solo se permiten documentos");
    }

    // Si es Desarrollo, validar contra ítems seleccionados
    if (tipoAlcance === 'Desarrollo') {
        const itemsRequeridos = await obtenerItemsRequeridos(id_actividad);

        if (itemsRequeridos.length === 0) {
            throw new Error("La actividad no tiene ítems requeridos configurados");
        }

        // Validar que el tipo coincida con algún ítem
        if (!itemsRequeridos.includes(tipo)) {
            throw new Error(
                `El tipo de entregable '${tipo}' no está permitido para esta actividad. ` +
                `Tipos permitidos: ${itemsRequeridos.join(', ')}`
            );
        }
    }

    return actividad;
}

async function procesarArchivo(tipo, datos) {
    let url_archivo = null;
    let nombre_archivo = null;
    let archivoTemporal = null;

    try {
        const timestamp = Date.now(); // identificador único por tiempo

        switch (tipo) {
            case TIPOS_ENTREGABLE.DOCUMENTO:
                if (!datos.file) throw new Error("No se proporcionó el archivo");
                nombre_archivo = `documento_${timestamp}${path.extname(datos.file.originalname)}`;
                url_archivo = await subirArchivoAFirebase(
                    datos.file.buffer,
                    nombre_archivo,
                    'documentos'
                );
                break;

            case TIPOS_ENTREGABLE.VIDEO:
                if (datos.esUrl) {
                    if (!datos.url_video) throw new Error("URL del video requerida");
                    url_archivo = datos.url_video;
                    nombre_archivo = `video_${timestamp}.url`;
                } else {
                    if (!datos.file) throw new Error("No se proporcionó el archivo de video");
                    nombre_archivo = `video_${timestamp}${path.extname(datos.file.originalname)}`;
                    url_archivo = await subirArchivoAFirebase(
                        datos.file.buffer,
                        nombre_archivo,
                        'videos'
                    );
                }
                break;

            case TIPOS_ENTREGABLE.AUDIO:
                if (datos.esUrl) {
                    if (!datos.url_audio) throw new Error("URL del audio requerida");
                    url_archivo = datos.url_audio;
                    nombre_archivo = `audio_${timestamp}.url`;
                } else {
                    if (!datos.file) throw new Error("No se proporcionó el archivo de audio");
                    nombre_archivo = `audio_${timestamp}${path.extname(datos.file.originalname)}`;
                    url_archivo = await subirArchivoAFirebase(
                        datos.file.buffer,
                        nombre_archivo,
                        'audios'
                    );
                }
                break;

            case TIPOS_ENTREGABLE.REPOSITORIO:
                if (!datos.url_repositorio) throw new Error("URL del repositorio requerida");

                console.log('🔄 Procesando repositorio...');
                const repoPath = await clonarRepositorio(datos.url_repositorio);
                const zipPath = await comprimirCarpeta(repoPath);

                if (!fs.existsSync(zipPath)) throw new Error('El archivo ZIP no se creó correctamente');

                nombre_archivo = `repositorio_${timestamp}.zip`;
                url_archivo = await subirArchivoAFirebase(zipPath, nombre_archivo, 'repositorios');
                archivoTemporal = [repoPath, zipPath];
                break;

            case TIPOS_ENTREGABLE.IMAGEN:
                if (datos.esUrl) {
                    if (!datos.url_imagen) throw new Error("URL de la imagen requerida");
                    archivoTemporal = await descargarImagen(datos.url_imagen);
                    nombre_archivo = `imagen_${timestamp}${path.extname(archivoTemporal)}`;
                    url_archivo = await subirArchivoAFirebase(archivoTemporal, nombre_archivo, 'imagenes');
                } else {
                    if (!datos.file) throw new Error("No se proporcionó el archivo de imagen");
                    nombre_archivo = `imagen_${timestamp}${path.extname(datos.file.originalname)}`;
                    url_archivo = await subirArchivoAFirebase(datos.file.buffer, nombre_archivo, 'imagenes');
                }
                break;

            default:
                throw new Error(`Tipo de entregable no soportado: ${tipo}`);
        }

        return { url_archivo, nombre_archivo };
    } finally {
        if (archivoTemporal) limpiarArchivosTemporales(archivoTemporal);
    }
}

async function crearEntregable(datosEntregable, codigo_usuario) {
    const transaction = await db.transaction();

    try {
        const { id_actividad, id_equipo, tipo, ...datosProcesamiento } = datosEntregable;

        if (!id_actividad) throw new Error("ID de actividad requerido");
        if (!id_equipo) throw new Error("ID de equipo requerido");
        if (!tipo) throw new Error("Tipo de entregable requerido");
        if (!codigo_usuario) throw new Error("Código de usuario requerido");

        const integrante = await IntegrantesEquipo.findOne({
            where: { id_equipo, codigo_usuario }
        });

        if (!integrante) {
            throw new Error("No eres miembro de este equipo");
        }

        const { proyecto } = await validarEquipoTieneProyecto(id_equipo);
        const actividad = await validarTipoEntregable(id_actividad, tipo.toUpperCase());

        const hoy = new Date();
        const fechaInicio = new Date(actividad.fecha_inicio);
        const fechaCierre = new Date(actividad.fecha_cierre);

        if (hoy < fechaInicio) throw new Error("La actividad aún no ha iniciado");
        if (hoy > fechaCierre) throw new Error("La actividad ya cerró. No se pueden subir más entregables");

        const estadoRevision = await Estado.findOne({
            where: { descripcion: 'REVISION' }
        });

        if (!estadoRevision) throw new Error("Estado REVISION no encontrado");

        // 1️⃣ Crear entregable inicial sin URL
        const nuevoEntregable = await Entregable.create({
            tipo: tipo.toUpperCase(),
            nombre_archivo: 'pendiente',
            url_archivo: null,
            id_proyecto: proyecto.id_proyecto,
            id_equipo,
            id_actividad,
            id_estado: estadoRevision.id_estado
        }, { transaction });

        // 2️⃣ Procesar archivo y subirlo usando el id_entregable
        const { url_archivo, nombre_archivo } = await procesarArchivo(
            tipo.toUpperCase(),
            { ...datosProcesamiento, id_entregable: nuevoEntregable.id_entregable }
        );

        // 3️⃣ Actualizar entregable con datos reales
        nuevoEntregable.url_archivo = url_archivo;
        nuevoEntregable.nombre_archivo = nombre_archivo;
        await nuevoEntregable.save({ transaction });

        // 4️⃣ Registrar historial
        await HistorialEntregable.create({
            id_entregable: nuevoEntregable.id_entregable,
            id_estado: estadoRevision.id_estado,
            codigo_usuario,
            observacion: `Entregable de tipo ${tipo} subido por ${codigo_usuario}`
        }, { transaction });

        await transaction.commit();

        // 5️⃣ Retornar con datos actualizados
        return await Entregable.findByPk(nuevoEntregable.id_entregable, {
            include: [
                { model: Proyecto, attributes: ['id_proyecto', 'linea_investigacion'] },
                { model: Equipo, attributes: ['id_equipo', 'descripcion'] },
                { model: Actividad, attributes: ['id_actividad', 'titulo'] },
                { model: Estado, attributes: ['descripcion'] }
            ]
        });

    } catch (error) {
        if (!transaction.finished) await transaction.rollback();
        throw error;
    }
}

async function enviarProyectoARevision(id_proyecto, id_actividad, codigo_usuario) {
    const transaction = await db.transaction();

    try {
        // Validar proyecto
        const proyecto = await Proyecto.findByPk(id_proyecto, {
            include: [{
                model: Idea,
                as: 'Idea',
                include: [{ model: Estado, as: 'Estado' }]
            }]
        });

        if (!proyecto) throw new Error("Proyecto no encontrado");

        // Validar que el usuario sea miembro del equipo
        const idea = proyecto.Idea;
        const equipo = await Equipo.findOne({
            where: {
                codigo_materia: idea.codigo_materia,
                nombre: idea.nombre,
                periodo: idea.periodo,
                anio: idea.anio
            },
            include: [{
                model: IntegrantesEquipo,
                as: 'Integrante_Equipos',
                where: { codigo_usuario }
            }]
        });

        if (!equipo) {
            throw new Error("No eres miembro del equipo de este proyecto");
        }

        // Validar que existan entregables para esta actividad
        const entregables = await Entregable.findAll({
            where: {
                id_proyecto,
                id_actividad
            }
        });

        if (entregables.length === 0) {
            throw new Error("No puedes enviar el proyecto a revisión sin haber subido entregables");
        }

        // Validar tipo de alcance y entregables requeridos
        const actividad = await Actividad.findByPk(id_actividad, {
            include: [{
                model: TipoAlcance,
                as: 'Tipo_alcance'
            }]
        });

        const tipoAlcance = actividad.Tipo_alcance.nombre.toUpperCase();

        if (tipoAlcance === 'Investigativo') {
            // Debe tener al menos un documento
            const tieneDocumento = entregables.some(e => e.tipo === 'DOCUMENTO');
            if (!tieneDocumento) {
                throw new Error("Para enviar a revisión un proyecto Investigativo debe tener al menos un documento");
            }
        } else if (tipoAlcance === 'Desarrollo') {
            // Validar que estén todos los ítems requeridos
            const itemsRequeridos = await obtenerItemsRequeridos(id_actividad);
            const tiposSubidos = entregables.map(e => e.tipo);

            const itemsFaltantes = itemsRequeridos.filter(
                item => !tiposSubidos.includes(item)
            );

            if (itemsFaltantes.length > 0) {
                throw new Error(
                    `Faltan los siguientes tipos de entregables: ${itemsFaltantes.join(', ')}`
                );
            }
        }

        // Cambiar estado del proyecto a REVISION
        const estadoRevision = await Estado.findOne({
            where: { descripcion: 'REVISION' }
        });

        // Registrar en historial del proyecto
        await HistorialProyecto.create({
            id_proyecto,
            id_estado: estadoRevision.id_estado,
            codigo_usuario,
            observacion: `Proyecto enviado a revisión para la actividad "${actividad.titulo}". Total de entregables: ${entregables.length}`
        }, { transaction });

        await transaction.commit();

        return {
            mensaje: "Proyecto enviado a revisión exitosamente",
            total_entregables: entregables.length,
            actividad: actividad.titulo
        };

    } catch (error) {
        if (!transaction.finished) {
            await transaction.rollback();
        }
        throw error;
    }
}

async function actualizarEntregable(id_entregable, datosEntregable, codigo_usuario) {
  const transaction = await db.transaction();

  try {
    if (!id_entregable) throw new Error("ID de entregable requerido");
    if (!codigo_usuario) throw new Error("Código de usuario requerido");

    // Obtener entregable existente
    const entregable = await Entregable.findByPk(id_entregable, {
      include: [
        { model: Proyecto },
        { model: Actividad }
      ],
      transaction
    });

    if (!entregable) throw new Error("Entregable no encontrado");

    // Verificar que es miembro del equipo
    const integrante = await IntegrantesEquipo.findOne({
      where: {
        id_equipo: entregable.id_equipo,
        codigo_usuario
      },
      transaction
    });

    if (!integrante) {
      throw new Error("No eres miembro de este equipo");
    }

    // Validar que la actividad no haya cerrado
    const actividad = entregable.Actividad;
    const hoy = new Date();
    const fechaCierre = new Date(actividad.fecha_cierre);

    if (hoy > fechaCierre) {
      throw new Error("La actividad ya cerró. No se pueden actualizar entregables");
    }

    const { tipo, ...datosProcesamiento } = datosEntregable;

    // Procesar nuevo archivo/URL
    const { url_archivo, nombre_archivo } = await procesarArchivo(
      tipo.toUpperCase(),
      { ...datosProcesamiento, id_entregable }
    );

    // Actualizar entregable
    entregable.url_archivo = url_archivo;
    entregable.nombre_archivo = nombre_archivo;
    await entregable.save({ transaction });

    // Registrar en historial
    const estadoRevision = await Estado.findOne({
      where: { descripcion: 'REVISION' },
      transaction
    });

    await HistorialEntregable.create({
      id_entregable,
      id_estado: estadoRevision.id_estado,
      codigo_usuario,
      observacion: `Entregable de tipo ${tipo} actualizado por ${codigo_usuario}`
    }, { transaction });

    await transaction.commit();

    // Retornar con datos actualizados
    return await Entregable.findByPk(id_entregable, {
      include: [
        { model: Proyecto, attributes: ['id_proyecto', 'linea_investigacion'] },
        { model: Equipo, attributes: ['id_equipo', 'descripcion'] },
        { model: Actividad, attributes: ['id_actividad', 'titulo'] },
        { model: Estado, attributes: ['descripcion'] }
      ]
    });

  } catch (error) {
    if (!transaction.finished) await transaction.rollback();
    throw error;
  }
}

async function retroalimentarEntregable(id_entregable, comentarios, calificacion, codigo_usuario) {
    const transaction = await db.transaction();

    try {
        if (!codigo_usuario) {
            throw new Error("Debe especificar el código del usuario que realiza la retroalimentación.");
        }

        const entregable = await Entregable.findByPk(id_entregable, { transaction });
        if (!entregable) throw new Error("Entregable no encontrado");

        if (calificacion !== undefined && (calificacion < 0 || calificacion > 5)) {
            throw new Error("La calificación debe estar entre 0 y 5");
        }

        entregable.comentarios = comentarios || "Sin comentarios";
        if (calificacion !== undefined) entregable.calificacion = calificacion;

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

export default {
    actualizarEntregable,
    crearEntregable,
    enviarProyectoARevision,
    retroalimentarEntregable,
    TIPOS_ENTREGABLE
};