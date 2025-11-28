import ProyectoService from "../services/ProyectoService.js";
import ExcelJS from "exceljs";
import PdfPrinter from "pdfmake";
import path from "path";

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

async function getSemesterProjects(req, res) {
  try {
    const data = await ProyectoService.getSemesterProjects();
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: "Error obteniendo proyectos semanales" });
  }
}

async function getSemesterByLine(req, res) {
  try {
    const data = await ProyectoService.getSemesterByLine();
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: "Error obteniendo proyectos por línea" });
  }
}

async function getSemesterByScope(req, res) {
  try {
    const data = await ProyectoService.getSemesterByScope();
    res.json(data);
  } catch (e) {
    res.status(500).json({ error: "Error obteniendo proyectos por alcance" });
  }
}

async function getSemesterByTech(req, res) {
  try {
    const data = await ProyectoService.getSemesterByTech();
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

async function exportarProyectosExcel(req, res) {
  try {
    const { tipo, fechaInicio, fechaFin, anio, periodo } = req.query;

    if (!tipo || !["fecha", "semestre", "todos"].includes(tipo)) {
      return res.status(400).json({
        error: "El tipo debe ser 'fecha', 'semestre' o 'todos'."
      });
    }

    const data = await ProyectoService.exportarProyectos({
      tipo,
      fechaInicio,
      fechaFin,
      anio: anio,
      periodo: periodo
    });

    if (data.length === 0)
      return res.status(404).json({ message: "No hay datos para exportar." });

    // ====================================
    // Crear Excel
    // ====================================
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Proyectos");

    // Columnas del Excel
    sheet.columns = [
      { header: "Título", key: "titulo", width: 30 },
      { header: "Problema", key: "problema", width: 30 },
      { header: "Justificación", key: "justificacion", width: 30 },
      { header: "Objetivo General", key: "objetivo_general", width: 30 },
      { header: "Objetivos Específicos", key: "objetivos_especificos", width: 30 },
      { header: "Línea de Investigación", key: "linea_investigacion", width: 25 },
      { header: "Tecnologías", key: "tecnologias", width: 25 },
      { header: "Palabras Clave", key: "palabras_clave", width: 25 },
      { header: "Tipo de Alcance", key: "tipo_alcance", width: 20 },
      { header: "Grupo", key: "grupo", width: 30 },
      { header: "Equipo", key: "equipo", width: 40 },
      { header: "URL Entregable", key: "url_entregable", width: 60 },
      { header: "Fecha Subida", key: "fecha_subida", width: 15 }
    ];

    // Procesar cada proyecto
    data.forEach(proyecto => {
      let primeraFila = true;

      proyecto.grupos.forEach(grupoData => {
        grupoData.equipos.forEach(equipoData => {
          equipoData.entregables.forEach(entregable => {
            const fila = {
              grupo: grupoData.grupo,
              equipo: equipoData.equipo,
              url_entregable: entregable.url,
              fecha_subida: entregable.fecha
            };

            // Solo agregar los datos del proyecto en la primera fila
            if (primeraFila) {
              fila.titulo = proyecto.titulo;
              fila.problema = proyecto.problema;
              fila.justificacion = proyecto.justificacion;
              fila.objetivo_general = proyecto.objetivo_general;
              fila.objetivos_especificos = proyecto.objetivos_especificos;
              fila.linea_investigacion = proyecto.linea_investigacion;
              fila.tecnologias = proyecto.tecnologias;
              fila.palabras_clave = proyecto.palabras_clave;
              fila.tipo_alcance = proyecto.tipo_alcance;
              primeraFila = false;
            }

            sheet.addRow(fila);
          });
        });
      });

      // Agregar una fila vacía entre proyectos para separación visual
      sheet.addRow({});
    });

    // Aplicar estilos a los encabezados
    sheet.getRow(1).font = { bold: true };
    sheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD3D3D3' }
    };

    // ====================================
    // Respuesta del archivo
    // ====================================
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=proyectos.xlsx"
    );

    await workbook.xlsx.write(res);
    res.end();

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function exportarProyectosPDF(req, res) {
  try {
    const { tipo, fechaInicio, fechaFin, anio, periodo } = req.query;

    if (!tipo || !["fecha", "semestre", "todos"].includes(tipo)) {
      return res.status(400).json({
        error: "El tipo debe ser 'fecha', 'semestre' o 'todos'."
      });
    }

    const data = await ProyectoService.exportarProyectos({
      tipo,
      fechaInicio,
      fechaFin,
      anio: parseInt(anio),
      periodo: periodo
    });

    if (data.length === 0)
      return res.status(404).json({ message: "No hay datos para exportar." });

    // ================================
    // 1. FUENTES LOCALES
    // ================================
    const fonts = {
      Roboto: {
        normal: path.resolve("src/fonts/Roboto-Regular.ttf"),
        bold: path.resolve("src/fonts/Roboto-Bold.ttf"),
        italics: path.resolve("src/fonts/Roboto-Italic.ttf"),
        bolditalics: path.resolve("src/fonts/Roboto-Medium.ttf")
      }
    };

    const printer = new PdfPrinter(fonts);

    // ================================
    // 2. ARMAR CONTENIDO FORMATEADO
    // ================================
    const contenido = [
      {
        text: "REPORTE DE PROYECTOS",
        style: "tituloPrincipal",
        margin: [0, 0, 0, 30]
      }
    ];

    data.forEach((proyecto, index) => {
      // Título del proyecto
      contenido.push({
        text: `PROYECTO #${index + 1}`,
        style: "proyectoNumero",
        margin: [0, 0, 0, 15]
      });

      // Información general del proyecto en tabla
      const infoProyecto = [
        [
          { text: "Título", style: "labelTabla" },
          { text: proyecto.titulo || "N/A", style: "valorTabla" }
        ],
        [
          { text: "Problema", style: "labelTabla" },
          { text: proyecto.problema || "N/A", style: "valorTabla" }
        ],
        [
          { text: "Justificación", style: "labelTabla" },
          { text: proyecto.justificacion || "N/A", style: "valorTabla" }
        ],
        [
          { text: "Objetivo General", style: "labelTabla" },
          { text: proyecto.objetivo_general || "N/A", style: "valorTabla" }
        ],
        [
          { text: "Objetivos Específicos", style: "labelTabla" },
          { text: proyecto.objetivos_especificos || "N/A", style: "valorTabla" }
        ],
        [
          { text: "Línea de Investigación", style: "labelTabla" },
          { text: proyecto.linea_investigacion || "N/A", style: "valorTabla" }
        ],
        [
          { text: "Tecnologías", style: "labelTabla" },
          { text: proyecto.tecnologias || "N/A", style: "valorTabla" }
        ],
        [
          { text: "Palabras Clave", style: "labelTabla" },
          { text: proyecto.palabras_clave || "N/A", style: "valorTabla" }
        ],
        [
          { text: "Tipo de Alcance", style: "labelTabla" },
          { text: proyecto.tipo_alcance || "N/A", style: "valorTabla" }
        ]
      ];

      contenido.push({
        table: {
          widths: [150, "*"],
          body: infoProyecto
        },
        layout: {
          hLineWidth: () => 0.5,
          vLineWidth: () => 0.5,
          hLineColor: () => "#DDDDDD",
          vLineColor: () => "#DDDDDD",
          paddingLeft: () => 8,
          paddingRight: () => 8,
          paddingTop: () => 6,
          paddingBottom: () => 6
        },
        margin: [0, 0, 0, 20]
      });

      // Sección de grupos y equipos
      contenido.push({
        text: "GRUPOS Y EQUIPOS",
        style: "seccionTitulo",
        margin: [0, 10, 0, 10]
      });

      proyecto.grupos.forEach((grupoData, grupoIndex) => {
        // Información del grupo
        contenido.push({
          table: {
            widths: [80, "*"],
            body: [
              [
                { text: "Grupo", style: "labelSecundario", fillColor: "#F0F0F0" },
                { text: grupoData.grupo, style: "valorSecundario", fillColor: "#F0F0F0" }
              ]
            ]
          },
          layout: {
            hLineWidth: () => 0.5,
            vLineWidth: () => 0.5,
            hLineColor: () => "#CCCCCC",
            vLineColor: () => "#CCCCCC"
          },
          margin: [0, 5, 0, 5]
        });

        grupoData.equipos.forEach((equipoData, equipoIndex) => {
          // Información del equipo
          contenido.push({
            table: {
              widths: [80, "*"],
              body: [
                [
                  { text: "Equipo", style: "labelSecundario" },
                  { text: equipoData.equipo || "Sin integrantes", style: "valorSecundario" }
                ]
              ]
            },
            layout: {
              hLineWidth: () => 0.5,
              vLineWidth: () => 0.5,
              hLineColor: () => "#DDDDDD",
              vLineColor: () => "#DDDDDD"
            },
            margin: [10, 0, 0, 5]
          });

          // Tabla de entregables
          const entregablesBody = [
            [
              { text: "#", style: "headerEntregables", fillColor: "#E8E8E8" },
              { text: "URL del Entregable", style: "headerEntregables", fillColor: "#E8E8E8" },
              { text: "Fecha", style: "headerEntregables", fillColor: "#E8E8E8" }
            ]
          ];

          equipoData.entregables.forEach((entregable, entIndex) => {
            entregablesBody.push([
              { text: (entIndex + 1).toString(), style: "celdaEntregable" },
              { text: entregable.url, style: "celdaEntregable" },
              { text: entregable.fecha, style: "celdaEntregable" }
            ]);
          });

          contenido.push({
            table: {
              widths: [30, "*", 70],
              body: entregablesBody
            },
            layout: {
              hLineWidth: () => 0.5,
              vLineWidth: () => 0.5,
              hLineColor: () => "#DDDDDD",
              vLineColor: () => "#DDDDDD",
              paddingLeft: () => 6,
              paddingRight: () => 6,
              paddingTop: () => 4,
              paddingBottom: () => 4
            },
            margin: [20, 0, 0, 10]
          });
        });
      });

      // Línea separadora entre proyectos
      if (index < data.length - 1) {
        contenido.push({
          canvas: [
            {
              type: "line",
              x1: 0,
              y1: 0,
              x2: 515,
              y2: 0,
              lineWidth: 2,
              lineColor: "#1D3557"
            }
          ],
          margin: [0, 20, 0, 30]
        });
      }
    });

    // ================================
    // 3. DEFINICIÓN PDF
    // ================================
    const docDefinition = {
      pageSize: "A4",
      pageMargins: [40, 40, 40, 40],
      content: contenido,
      styles: {
        tituloPrincipal: {
          fontSize: 24,
          bold: true,
          color: "#1D3557",
          alignment: "center"
        },
        proyectoNumero: {
          fontSize: 16,
          bold: true,
          color: "#457B9D",
          alignment: "left"
        },
        seccionTitulo: {
          fontSize: 13,
          bold: true,
          color: "#1D3557"
        },
        labelTabla: {
          fontSize: 10,
          bold: true,
          color: "#1D3557"
        },
        valorTabla: {
          fontSize: 10,
          color: "#333333"
        },
        labelSecundario: {
          fontSize: 10,
          bold: true,
          color: "#1D3557"
        },
        valorSecundario: {
          fontSize: 10,
          color: "#333333"
        },
        headerEntregables: {
          fontSize: 9,
          bold: true,
          color: "#1D3557",
          alignment: "center"
        },
        celdaEntregable: {
          fontSize: 9,
          color: "#333333"
        }
      }
    };

    // ================================
    // 4. GENERAR PDF
    // ================================
    const pdfDoc = printer.createPdfKitDocument(docDefinition);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=proyectos.pdf");

    pdfDoc.pipe(res);
    pdfDoc.end();

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
}



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
  getSemesterProjects,
  getSemesterByLine,
  getSemesterByScope,
  getSemesterByTech,
  createDataProject,
  exportarProyectosExcel,
  exportarProyectosPDF
};