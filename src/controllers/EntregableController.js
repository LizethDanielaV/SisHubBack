import EntregableService from "../services/EntregableService.js";
import Equipo from "../models/Equipo.js";
import IntegrantesEquipo from "../models/IntegrantesEquipo.js";
import path from "path";

async function obtenerEntregablesPorProyectoYActividad(req, res) {
  try {
    const { id_proyecto, id_actividad } = req.params;

    if (!id_proyecto || !id_actividad) {
      return res.status(400).json({
        error: "ID de proyecto e ID de actividad son requeridos"
      });
    }

    const entregables = await EntregableService.obtenerEntregablesPorProyectoYActividad(
      id_proyecto,
      id_actividad
    );

    return res.status(200).json(entregables);

  } catch (error) {
    console.error("Error al obtener entregables:", error);
    return res.status(500).json({
      error: "Error al obtener los entregables",
      detalle: error.message
    });
  }
}

async function actualizarEntregable(req, res) {
  try {
    const { id_entregable } = req.params;
    const { codigo_usuario } = req.body;

    if (!id_entregable) {
      return res.status(400).json({ error: "ID de entregable requerido" });
    }

    if (!codigo_usuario) {
      return res.status(400).json({ error: "Código de usuario requerido" });
    }

    const entregableExistente = await EntregableService.obtenerEntregablePorId(id_entregable);

    if (!entregableExistente) {
      return res.status(404).json({ error: "Entregable no encontrado" });
    }

    // Verificar permisos (esta lógica podría ir al servicio también)
    const equipo = await Equipo.findOne({
      where: { id_equipo: entregableExistente.id_equipo },
      include: [{
        model: IntegrantesEquipo,
        as: 'Integrante_Equipos',
        where: { codigo_usuario }
      }]
    });

    if (!equipo) {
      return res.status(403).json({
        error: "No tienes permiso para actualizar este entregable"
      });
    }

    // Preparar datos
    const datosActualizacion = {
      id_actividad: entregableExistente.id_actividad,
      id_equipo: entregableExistente.id_equipo,
      tipo: entregableExistente.tipo,
      esUrl: req.body.esUrl === 'true' || req.body.esUrl === true,
      url_video: req.body.url_video,
      url_audio: req.body.url_audio,
      url_repositorio: req.body.url_repositorio,
      url_imagen: req.body.url_imagen,
      file: req.file
    };

    const entregableActualizado = await EntregableService.actualizarEntregable(
      id_entregable,
      datosActualizacion,
      codigo_usuario
    );

    return res.status(200).json(entregableActualizado);

  } catch (error) {
    console.error("Error al actualizar entregable:", error);
    return res.status(500).json({
      error: error.message || "Error al actualizar el entregable"
    });
  }
}

async function extraerTextoDocumento(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No se proporcionó ningún archivo" });
    }

    const archivo = req.file;
    const extension = path.extname(archivo.originalname).toLowerCase();

    let texto = '';

    if (extension === '.pdf') {
      // Extraer texto de PDF usando pdf-parse
      const pdfParse = require('pdf-parse');
      const dataBuffer = archivo.buffer;
      const data = await pdfParse(dataBuffer);
      texto = data.text;

    } else if (extension === '.docx' || extension === '.doc') {
      // Extraer texto de Word usando mammoth
      const mammoth = require('mammoth');
      const result = await mammoth.extractRawText({ buffer: archivo.buffer });
      texto = result.value;

    } else {
      return res.status(400).json({
        error: "Formato no soportado. Solo se permiten PDF o Word"
      });
    }

    return res.status(200).json({ texto });

  } catch (error) {
    console.error("Error al extraer texto:", error);
    return res.status(500).json({
      error: "Error al procesar el documento",
      detalle: error.message
    });
  }
}

async function crearEntregable(req, res) {
  try {
    const { 
      id_actividad, 
      id_equipo, 
      tipo, 
      codigo_usuario,
      esUrl,
      url_video,
      url_audio,
      url_repositorio,
      url_imagen
    } = req.body;

    // Validaciones básicas
    if (!id_actividad) {
      return res.status(400).json({ error: "ID de actividad requerido" });
    }

    if (!id_equipo) {
      return res.status(400).json({ error: "ID de equipo requerido" });
    }

    if (!tipo) {
      return res.status(400).json({ error: "Tipo de entregable requerido" });
    }

    if (!codigo_usuario) {
      return res.status(400).json({ error: "Código de usuario requerido" });
    }

    // Preparar datos para el servicio
    const datosEntregable = {
      id_actividad,
      id_equipo,
      tipo,
      esUrl: esUrl === 'true' || esUrl === true,
      url_video,
      url_audio,
      url_repositorio,
      url_imagen,
      file: req.file // Si viene archivo de multer
    };

    const entregable = await EntregableService.crearEntregable(
      datosEntregable,
      codigo_usuario
    );

    return res.status(201).json({
      mensaje: "Entregable subido exitosamente",
      data: entregable
    });

  } catch (error) {
    console.error("Error al crear entregable:", error);
    return res.status(400).json({
      error: error.message || "Error al subir el entregable"
    });
  }
}

async function deshabilitarEntregable(req, res) {
    try {
        const { id_entregable } = req.params;
        const { codigo_usuario } = req.body;

        const resultado = await EntregableService.deshabilitarEntregable(id_entregable, codigo_usuario);
        res.json(resultado);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
}

const listarHistorialPorProyecto = async (req, res) => {
  try {
    const { id_proyecto } = req.params;
    const historial = await EntregableService.obtenerHistorialProyecto(id_proyecto);
    res.json(historial);
  } catch (error) {
    console.error("Error en controller historial:", error);
    res.status(500).json({
      message: "Error al obtener historial del proyecto",
      error: error.message,
    });
  }
};

async function enviarProyectoARevision(req, res) {
  try {
    const { id_proyecto } = req.params;
    const { codigo_usuario } = req.body;

    if (!id_proyecto) {
      return res.status(400).json({ error: "ID de proyecto requerido" });
    }

    if (!codigo_usuario) {
      return res.status(400).json({ error: "Código de usuario requerido" });
    }

    const resultado = await EntregableService.enviarProyectoARevision(
      parseInt(id_proyecto),
      codigo_usuario
    );

    return res.status(200).json(resultado);

  } catch (error) {
    console.error("Error al enviar proyecto a revisión:", error);
    return res.status(400).json({
      error: error.message || "Error al enviar el proyecto a revisión"
    });
  }
}

async function retroalimentarEntregable(req, res) {
  try {
    const { id_entregable } = req.params;
    const { comentarios, calificacion, codigo_usuario } = req.body;

    if (!id_entregable) {
      return res.status(400).json({ 
        message: "Debe proporcionar el id del entregable." 
      });
    }

    const resultado = await EntregableService.retroalimentarEntregable(
      id_entregable,
      comentarios,
      calificacion,
      codigo_usuario
    );

    return res.status(200).json(resultado);
    
  } catch (error) {
    res.status(500).json({
      message: "Error al registrar la retroalimentación del entregable.",
      error: error.message,
    });
  }
}

async function obtenerHistorialEntregable(req, res) {
    const { id_entregable } = req.params;

    try {
        const historial = await EntregableService.obtenerHistorialEntregable(id_entregable);
        return res.status(200).json({
            success: true,
            historial
        });
    } catch (error) {
        console.error("Error en obtenerHistorialEntregable:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Error al obtener el historial del entregable"
        });
    }
}

async function obtenerTiposEntregable(req, res) {
  try {
    return res.status(200).json({
      tipos: EntregableService.TIPOS_ENTREGABLE,
      descripcion: {
        DOCUMENTO: "Archivos PDF, Word, etc.",
        VIDEO: "Videos (archivo o URL de YouTube)",
        AUDIO: "Audios (archivo o URL de YouTube)",
        REPOSITORIO: "Enlace a repositorio Git",
        IMAGEN: "Imágenes (archivo o URL)"
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export default {
  obtenerEntregablesPorProyectoYActividad, 
  deshabilitarEntregable,
  actualizarEntregable,
  extraerTextoDocumento,
  crearEntregable,
  obtenerHistorialEntregable,
  enviarProyectoARevision,
  retroalimentarEntregable,
  obtenerTiposEntregable,
  listarHistorialPorProyecto
};