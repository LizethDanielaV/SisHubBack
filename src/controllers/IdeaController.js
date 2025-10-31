import IdeaService from "../services/IdeaService.js";

async function revisarIdea(req, res) {
  try {
    const { id_idea } = req.params;
    const { accion, observacion, codigo_usuario } = req.body;

    if (!codigo_usuario)
      return res.status(400).json({ message: "No se proporcionó el código del docente." });

    const resultado = await IdeaService.revisarIdea(
      id_idea,
      accion,
      observacion,
      codigo_usuario
    );

    res.status(200).json({
      message: "Revisión registrada correctamente",
      resultado,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}

async function crearIdea(req, res) {
    try {
        const codigoUsuario = req.usuario.codigo;
        const datosIdea = req.body;

        // Validaciones de entrada
        const { titulo, problema, justificacion, objetivo_general, objetivos_especificos, grupo, integrantes } = datosIdea;

        if (!titulo || titulo.trim().length === 0) {
            return res.status(400).json({
                error: "El título es obligatorio"
            });
        }

        if (titulo.length > 50) {
            return res.status(400).json({
                error: "El título no puede exceder 50 caracteres"
            });
        }

        if (!problema || problema.trim().length === 0) {
            return res.status(400).json({
                error: "El problema es obligatorio"
            });
        }

        if (!justificacion || justificacion.trim().length === 0) {
            return res.status(400).json({
                error: "La justificación es obligatoria"
            });
        }

        if (!objetivo_general || objetivo_general.trim().length === 0) {
            return res.status(400).json({
                error: "El objetivo general es obligatorio"
            });
        }

        if (objetivo_general.length > 100) {
            return res.status(400).json({
                error: "El objetivo general no puede exceder 100 caracteres"
            });
        }

        if (!objetivos_especificos || objetivos_especificos.trim().length === 0) {
            return res.status(400).json({
                error: "Los objetivos específicos son obligatorios"
            });
        }

        if (!grupo || !grupo.codigo_materia || !grupo.nombre || !grupo.periodo || !grupo.anio) {
            return res.status(400).json({
                error: "Los datos del grupo son obligatorios (codigo_materia, nombre, periodo, anio)"
            });
        }

        // Validar integrantes si vienen en el JSON
        if (integrantes !== undefined) {
            if (!Array.isArray(integrantes)) {
                return res.status(400).json({
                    error: "Los integrantes deben ser un array"
                });
            }

            if (integrantes.length > 10) {
                return res.status(400).json({
                    error: "No se pueden agregar más de 10 integrantes"
                });
            }

            // Validar que no haya códigos duplicados
            const codigosUnicos = new Set(integrantes);
            if (codigosUnicos.size !== integrantes.length) {
                return res.status(400).json({
                    error: "Hay códigos de usuarios duplicados en los integrantes"
                });
            }

            // Validar que el líder no esté en la lista
            if (integrantes.includes(codigoUsuario)) {
                return res.status(400).json({
                    error: "No debes incluirte en la lista de integrantes, ya eres el líder automáticamente"
                });
            }
        }

        const ideaCreada = await IdeaService.crearIdea(datosIdea, codigoUsuario);

        return res.status(201).json({
            mensaje: "Idea creada exitosamente",
            data: ideaCreada
        });

    } catch (error) {
        console.error("Error al crear idea:", error);
        return res.status(400).json({
            error: error.message || "Error al crear la idea"
        });
    }
}

async function actualizarIdea(req, res) {
    try {
        const idIdea = parseInt(req.params.id);
        const codigoUsuario = req.usuario.codigo;
        const datosActualizacion = req.body;

        if (isNaN(idIdea)) {
            return res.status(400).json({
                error: "ID de idea inválido"
            });
        }

        // Validar que al menos un campo esté presente
        const camposPermitidos = ["titulo", "problema", "justificacion", "objetivo_general", "objetivos_especificos"];
        const camposGestion = ["integrantes_agregar", "integrantes_eliminar"];
        
        const tieneAlgunCampo = camposPermitidos.some(campo => datosActualizacion[campo] !== undefined);
        const tieneGestionIntegrantes = camposGestion.some(campo => datosActualizacion[campo] !== undefined);

        if (!tieneAlgunCampo && !tieneGestionIntegrantes) {
            return res.status(400).json({
                error: "Debe proporcionar al menos un campo para actualizar"
            });
        }

        // Validar longitudes si se proporcionan
        if (datosActualizacion.titulo && datosActualizacion.titulo.length > 50) {
            return res.status(400).json({
                error: "El título no puede exceder 50 caracteres"
            });
        }

        if (datosActualizacion.objetivo_general && datosActualizacion.objetivo_general.length > 100) {
            return res.status(400).json({
                error: "El objetivo general no puede exceder 100 caracteres"
            });
        }

        // Validar integrantes_agregar si viene
        if (datosActualizacion.integrantes_agregar !== undefined) {
            if (!Array.isArray(datosActualizacion.integrantes_agregar)) {
                return res.status(400).json({
                    error: "integrantes_agregar debe ser un array"
                });
            }

            if (datosActualizacion.integrantes_agregar.length > 5) {
                return res.status(400).json({
                    error: "No se pueden agregar más de 5 integrantes a la vez"
                });
            }

            // Validar que no haya duplicados
            const codigosUnicos = new Set(datosActualizacion.integrantes_agregar);
            if (codigosUnicos.size !== datosActualizacion.integrantes_agregar.length) {
                return res.status(400).json({
                    error: "Hay códigos duplicados en integrantes_agregar"
                });
            }
        }

        // Validar integrantes_eliminar si viene
        if (datosActualizacion.integrantes_eliminar !== undefined) {
            if (!Array.isArray(datosActualizacion.integrantes_eliminar)) {
                return res.status(400).json({
                    error: "integrantes_eliminar debe ser un array"
                });
            }

            if (datosActualizacion.integrantes_eliminar.length === 0) {
                return res.status(400).json({
                    error: "integrantes_eliminar no puede estar vacío"
                });
            }

            // Validar que el líder no esté en la lista
            if (datosActualizacion.integrantes_eliminar.includes(codigoUsuario)) {
                return res.status(400).json({
                    error: "No puedes eliminarte como líder del equipo"
                });
            }
        }

        const ideaActualizada = await IdeaService.actualizarIdea(idIdea, datosActualizacion, codigoUsuario);

        return res.status(200).json({
            mensaje: "Idea actualizada exitosamente",
            data: ideaActualizada
        });

    } catch (error) {
        console.error("Error al actualizar idea:", error);
        return res.status(400).json({
            error: error.message || "Error al actualizar la idea"
        });
    }
}

async function obtenerIdea(req, res) {
    try {
        const idIdea = parseInt(req.params.id);

        if (isNaN(idIdea)) {
            return res.status(400).json({
                error: "ID de idea inválido"
            });
        }

        const idea = await IdeaService.obtenerIdeaPorId(idIdea);

        return res.status(200).json({
            data: idea
        });

    } catch (error) {
        console.error("Error al obtener idea:", error);

        if (error.message === "Idea no encontrada") {
            return res.status(404).json({
                error: error.message
            });
        }

        return res.status(500).json({
            error: "Error al obtener la idea"
        });
    }
}

async function listarMisIdeas(req, res) {
    try {
        const codigoUsuario = req.usuario.codigo;

        const ideas = await IdeaService.listarIdeasUsuario(codigoUsuario);

        return res.status(200).json({
            total: ideas.length,
            data: ideas
        });

    } catch (error) {
        console.error("Error al listar ideas:", error);
        return res.status(500).json({
            error: "Error al listar las ideas"
        });
    }
}

async function listarIdeasGrupo(req, res) {
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

        const ideas = await IdeaService.listarIdeasPorGrupo(datosGrupo);

        return res.status(200).json({
            total: ideas.length,
            grupo: datosGrupo,
            data: ideas
        });

    } catch (error) {
        console.error("Error al listar ideas del grupo:", error);
        return res.status(500).json({
            error: "Error al listar las ideas del grupo"
        });
    }
}

export default { revisarIdea, crearIdea, actualizarIdea,obtenerIdea, listarMisIdeas, listarIdeasGrupo };