import EntregableService from "../services/EntregableService.js";

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

async function enviarProyectoARevision(req, res) {
  try {
    const { id_proyecto } = req.params;
    const { id_actividad, codigo_usuario } = req.body;

    if (!id_proyecto) {
      return res.status(400).json({ error: "ID de proyecto requerido" });
    }

    if (!id_actividad) {
      return res.status(400).json({ error: "ID de actividad requerido" });
    }

    if (!codigo_usuario) {
      return res.status(400).json({ error: "Código de usuario requerido" });
    }

    const resultado = await EntregableService.enviarProyectoARevision(
      parseInt(id_proyecto),
      parseInt(id_actividad),
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
  crearEntregable,
  enviarProyectoARevision,
  retroalimentarEntregable,
  obtenerTiposEntregable
};