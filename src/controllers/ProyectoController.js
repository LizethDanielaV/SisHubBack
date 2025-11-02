import ProyectoService from "../services/ProyectoService.js";

async function crearProyectoDesdeIdea(req, res) {
    try {
        const idIdea = parseInt(req.params.id);
        const datosProyecto = req.body;
        const { codigo_usuario } = req.body; // ← Obtener del body

        if (isNaN(idIdea)) {
            return res.status(400).json({
                error: "ID de idea inválido"
            });
        }

        // Validar que venga el código de usuario
        if (!codigo_usuario || codigo_usuario.trim().length === 0) {
            return res.status(400).json({
                error: "El código de usuario es obligatorio"
            });
        }

        const { linea_investigacion, tecnologias, palabras_clave } = datosProyecto;

        // Validaciones
        if (!linea_investigacion || linea_investigacion.trim().length === 0) {
            return res.status(400).json({
                error: "La línea de investigación es obligatoria"
            });
        }

        if (linea_investigacion.length > 150) {
            return res.status(400).json({
                error: "La línea de investigación no puede exceder 150 caracteres"
            });
        }

        if (tecnologias && tecnologias.length > 150) {
            return res.status(400).json({
                error: "Las tecnologías no pueden exceder 150 caracteres"
            });
        }

        if (palabras_clave && palabras_clave.length > 150) {
            return res.status(400).json({
                error: "Las palabras clave no pueden exceder 150 caracteres"
            });
        }

        const proyectoCreado = await ProyectoService.crearProyectoDesdeIdea(
            idIdea,
            datosProyecto,
            codigo_usuario
        );

        return res.status(201).json({
            mensaje: "Proyecto creado exitosamente a partir de la idea aprobada",
            data: proyectoCreado
        });

    } catch (error) {
        console.error("Error al crear proyecto:", error);
        return res.status(400).json({
            error: error.message || "Error al crear el proyecto"
        });
    }
}

async function obtenerProyecto(req, res) {
    try {
        const idProyecto = parseInt(req.params.id);

        if (isNaN(idProyecto)) {
            return res.status(400).json({
                error: "ID de proyecto inválido"
            });
        }

        const proyecto = await ProyectoService.obtenerProyectoPorId(idProyecto);

        return res.status(200).json({
            data: proyecto
        });

    } catch (error) {
        console.error("Error al obtener proyecto:", error);

        if (error.message === "Proyecto no encontrado") {
            return res.status(404).json({
                error: error.message
            });
        }

        return res.status(500).json({
            error: "Error al obtener el proyecto"
        });
    }
}
/*
async function listarProyectosPorGrupo(req, res) {
    try {
        const { codigo_materia, nombre, periodo, anio } = req.query;

        if (!codigo_materia || !nombre || !periodo || !anio) {
            return res.status(400).json({
                error: "Debe proporcionar codigo_materia, nombre, periodo y anio"
            });
        }

        const datosGrupo = {
            codigo_materia,
            nombre,
            periodo,
            anio: parseInt(anio)
        };

        if (isNaN(datosGrupo.anio)) {
            return res.status(400).json({
                error: "El año debe ser un número válido"
            });
        }

        const proyectos = await ProyectoService.listarProyectosPorGrupo(datosGrupo);

        return res.status(200).json({
            total: proyectos.length,
            grupo: datosGrupo,
            data: proyectos
        });

    } catch (error) {
        console.error("Error al listar proyectos del grupo:", error);
        return res.status(500).json({
            error: "Error al listar los proyectos del grupo"
        });
    }
}
*/
async function actualizarProyecto(req, res) {
    try {
        const idProyecto = parseInt(req.params.id);
        const datosActualizacion = req.body;
        const { codigo_usuario } = req.body; // ← Del body también

        if (isNaN(idProyecto)) {
            return res.status(400).json({
                error: "ID de proyecto inválido"
            });
        }

        // Validar que venga el código de usuario
        if (!codigo_usuario || codigo_usuario.trim().length === 0) {
            return res.status(400).json({
                error: "El código de usuario es obligatorio"
            });
        }

        const { linea_investigacion, tecnologias, palabras_clave } = datosActualizacion;

        // Validar que al menos un campo esté presente (además de codigo_usuario)
        if (!linea_investigacion && !tecnologias && !palabras_clave) {
            return res.status(400).json({
                error: "Debe proporcionar al menos un campo para actualizar"
            });
        }

        // Validar longitudes
        if (linea_investigacion && linea_investigacion.length > 150) {
            return res.status(400).json({
                error: "La línea de investigación no puede exceder 150 caracteres"
            });
        }

        if (tecnologias && tecnologias.length > 150) {
            return res.status(400).json({
                error: "Las tecnologías no pueden exceder 150 caracteres"
            });
        }

        if (palabras_clave && palabras_clave.length > 150) {
            return res.status(400).json({
                error: "Las palabras clave no pueden exceder 150 caracteres"
            });
        }

        const proyectoActualizado = await ProyectoService.actualizarProyecto(
            idProyecto,
            datosActualizacion,
            codigo_usuario
        );

        return res.status(200).json({
            mensaje: "Proyecto actualizado exitosamente",
            data: proyectoActualizado
        });

    } catch (error) {
        console.error("Error al actualizar proyecto:", error);
        return res.status(400).json({
            error: error.message || "Error al actualizar el proyecto"
        });
    }
}

async function listarParaDirector(req, res) {
  try {
    const proyectos = await ProyectoService.listarProyectosDirector();
    res.json(proyectos);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error al obtener materias", error: error.message });
  }
}

async function listarTodosProyectosDeUnEstudiante(req, res) {
  try {
    const proyectos = await ProyectoService.listarTodosProyectosDeUnEstudiante(req.params.codigo_estudiante);
    res.json(proyectos);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error al obtener materias", error: error.message });
  }
}

async function listarTodosProyectosDeUnProfesor(req, res) {
  try {
    const proyectos = await ProyectoService.listarTodosProyectosDeUnProfesor(req.params.codigo_docente);
    res.json(proyectos);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error al obtener materias", error: error.message });
  }
}

async function listarTodosProyectosDeUnGrupo(req, res) {
  try {
    const proyectos = await ProyectoService.listarTodosProyectosDeUnGrupo(
        req.body.codigo_materia,
        req.body.nombre, 
        req.body.periodo, 
        req.body.anio
    );
    res.json(proyectos);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error al obtener materias", error: error.message });
  }
}

export default {
    crearProyectoDesdeIdea,
    obtenerProyecto,
    /*listarProyectosPorGrupo,*/
    actualizarProyecto, 
    listarParaDirector, 
    listarTodosProyectosDeUnEstudiante, 
    listarTodosProyectosDeUnProfesor, 
    listarTodosProyectosDeUnGrupo
};