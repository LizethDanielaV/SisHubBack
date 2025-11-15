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

async function rechazarObservacion(req, res) {
    const { id_idea } = req.params;
    const { codigo_usuario, id_proyecto } = req.body;

    try {
      const result = await ProyectoService.rechazarObservacion(id_idea, id_proyecto, codigo_usuario);
      res.status(200).json({
        success: true,
        message: result.message,
        idea: result.idea,
      });
    } catch (error) {
      console.error("Error en revisar idea:", error);
      res.status(500).json({
        success: false,
        message: error.message || "Error al revisar la idea",
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

const calificarProyecto = async (req, res) => {
  const { id_proyecto } = req.params;
  const { observacion, codigo_usuario } = req.body;

  try {
    const resultado = await ProyectoService.calificarProyecto(
      id_proyecto,
      observacion,
      codigo_usuario
    );
    res.status(200).json(resultado);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const continuarProyecto = async (req, res) => {
  const { id_proyecto } = req.params;
  const { codigo_usuario, grupo } = req.body;

  try {
    const resultado = await ProyectoService.continuarProyecto(
      id_proyecto,
      codigo_usuario,
      grupo
    );
    res.status(200).json(resultado);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const obtenerProyectosContinuables = async (req, res) => {
  const { codigo_usuario } = req.params;

  try {
    const proyectos = await ProyectoService.obtenerProyectosContinuables(codigo_usuario);
    res.status(200).json(proyectos);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};


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
    const { codigo_materia, nombre, periodo, anio } = req.query;
    const proyectos = await ProyectoService.listarTodosProyectosDeUnGrupo(
        codigo_materia,
        nombre, 
        periodo, 
        anio
    );
    res.json(proyectos);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error al obtener materias", error: error.message });
  }
}

export const liberarProyecto = async (req, res) => {
    try {
        const { idProyecto } = req.params;
        const { codigo_usuario } = req.body;

        if (!codigo_usuario) {
            return res.status(400).json({ error: "Se requiere el código del usuario líder" });
        }

        const resultado = await ProyectoService.liberarProyecto(idProyecto, codigo_usuario);
        return res.status(200).json(resultado);

    } catch (error) {
        return res.status(400).json({ error: error.message });
    }
};

async function listarPropuestasLibres(req, res) {
    try {
        const propuestas = await ProyectoService.listarPropuestasLibres();
        res.status(200).json({
            ok: true,
            total: propuestas.length,
            data: propuestas
        });
    } catch (error) {
        console.error("Error al listar el banco de propuestas:", error);
        res.status(500).json({
            ok: false,
            mensaje: "Error al listar el banco de propuestas",
            error: error.message
        });
    }
}

async function adoptarPropuesta(req, res) {
  try {
    const { id_proyecto } = req.params;
    const { codigo_usuario, grupo } = req.body;

    // Validaciones
    if (!codigo_usuario) {
      return res.status(400).json({ message: "El código del usuario es obligatorio." });
    }

    if (!grupo || !grupo.codigo_materia || !grupo.nombre || !grupo.periodo || !grupo.anio) {
      return res.status(400).json({
        message: "Los datos del grupo son obligatorios (codigo_materia, nombre, periodo, anio)."
      });
    }

    // Llamada al servicio
    const resultado = await ProyectoService.adoptarPropuesta(id_proyecto, codigo_usuario, grupo);

    return res.status(200).json(resultado);
  } catch (error) {
    console.error("Error al adoptar propuesta:", error);
    return res.status(500).json({
      message: "Error al adoptar la propuesta.",
      error: error.message
    });
  }
}


export const revisarProyecto = async (req, res) => {
  try {
    const { id_proyecto, accion, observacion, codigo_usuario } = req.body;

    if (!id_proyecto || !accion || !codigo_usuario) {
      return res.status(400).json({
        message: "Faltan datos obligatorios: id_proyecto, accion o codigo_usuario.",
      });
    }

    const resultado = await ProyectoService.revisarProyecto(
      id_proyecto,
      accion,
      observacion,
      codigo_usuario
    );

    res.status(200).json(resultado);
  } catch (error) {
    res.status(500).json({
      message: "Error al revisar el proyecto.",
      error: error.message,
    });
  }
};

async function verDetalleProyecto(req, res) {
  try {
    const proyecto = await ProyectoService.verDetalleProyecto(req.params.id_proyecto);
    res.status(200).json(proyecto);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error al obtener el proyecto", error: error.message });
  }
}

 async function generarHistorialProyecto(req, res) {
  try {
    const proyecto = await ProyectoService.generarHistorialProyecto(req.params.id_proyecto);
    res.status(200).json(proyecto);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error al obtener el proyecto", error: error.message });
  }
}

async function obtenerUltimoHistorial(req, res) {
  try {
    const { id_proyecto } = req.params;
    const historial = await ProyectoService.obtenerUltimoHistorialPorProyecto(id_proyecto);
    res.status(200).json(historial);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}

async function calcularAvanceProyecto(req, res) {
  try {
    const proyecto = await ProyectoService.calcularAvanceProyecto(req.params.id_proyecto);
    res.json(proyecto);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error al obtener materias", error: error.message });
  }
}

async function getWeeklyProjects(req, res) {
    try {
      const data = await ProyectoService.getWeeklyProjects();
      res.json(data);
    } catch (e) {
      res.status(500).json({ error: "Error obteniendo proyectos semanales" });
    }
  }

  async function getWeeklyByLine(req, res) {
    try {
      const data = await ProyectoService.getWeeklyByLine();
      res.json(data);
    } catch (e) {
      res.status(500).json({ error: "Error obteniendo proyectos por línea" });
    }
  }

  async function getWeeklyByScope(req, res) {
    try {
      const data = await ProyectoService.getWeeklyByScope();
      res.json(data);
    } catch (e) {
      res.status(500).json({ error: "Error obteniendo proyectos por alcance" });
    }
  }

 async function getWeeklyByTech(req, res) {
    try {
      const data = await ProyectoService.getWeeklyByTech();
      res.json(data);
    } catch (e) {
      res.status(500).json({ error: "Error obteniendo proyectos por tecnología" });
    }
  }

export const createDataProject = async (req, res) => {
    try {
        const proyecto = await ProyectoService.createDataProject(req.body);
        res.status(201).json(proyecto);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


export default {
    crearProyectoDesdeIdea,
    obtenerProyecto,
    rechazarObservacion,
    obtenerUltimoHistorial,
    /*listarProyectosPorGrupo,*/
    actualizarProyecto, 
    listarParaDirector, 
    listarTodosProyectosDeUnEstudiante, 
    listarTodosProyectosDeUnProfesor, 
    listarTodosProyectosDeUnGrupo,
    liberarProyecto,
    actualizarProyecto, 
    listarParaDirector, 
    revisarProyecto,
    adoptarPropuesta,
    calificarProyecto,
    listarPropuestasLibres,
    obtenerProyectosContinuables,
    continuarProyecto, 
    verDetalleProyecto, 
    generarHistorialProyecto, 
    calcularAvanceProyecto,
    getWeeklyProjects,
    getWeeklyByLine,
    getWeeklyByScope,
    getWeeklyByTech,
    createDataProject
};