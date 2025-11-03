import GrupoUsuarioService from "../services/GrupoUsuarioService.js";
import { progressService } from "../services/progressService.js";

async function matricularEstudiantesMasivamente(req, res) {
  try {
    let matriculas;

    // Soportar ambos formatos: único grupo o múltiples grupos
    if (req.body.estudiantes && !req.body.matriculas) {
      const { estudiantes, codigo_materia, nombre_grupo, periodo, anio } = req.body;
      
      if (!estudiantes || !Array.isArray(estudiantes) || estudiantes.length === 0) {
        return res.status(400).json({ 
          error: "Debe enviar un array de estudiantes" 
        });
      }

      if (!codigo_materia || !nombre_grupo || !periodo || !anio) {
        return res.status(400).json({ 
          error: "Debe especificar el grupo (codigo_materia, nombre_grupo, periodo, anio)" 
        });
      }

      matriculas = [{
        codigo_materia,
        nombre_grupo,
        periodo,
        anio,
        estudiantes
      }];
    } else if (req.body.matriculas) {
      matriculas = req.body.matriculas;
      
      if (!Array.isArray(matriculas) || matriculas.length === 0) {
        return res.status(400).json({ 
          error: "Debe enviar un array de matriculas" 
        });
      }
    } else {
      return res.status(400).json({ 
        error: "Formato inválido. Use 'estudiantes' para un grupo o 'matriculas' para múltiples grupos" 
      });
    }

    // Validar estructura de cada matrícula
    for (const matricula of matriculas) {
      if (!matricula.codigo_materia || !matricula.nombre_grupo || !matricula.periodo || !matricula.anio) {
        return res.status(400).json({ 
          error: "Cada matrícula debe tener codigo_materia, nombre_grupo, periodo y anio" 
        });
      }

      if (!matricula.estudiantes || !Array.isArray(matricula.estudiantes) || matricula.estudiantes.length === 0) {
        return res.status(400).json({ 
          error: `El grupo ${matricula.codigo_materia}-${matricula.nombre_grupo} debe tener estudiantes` 
        });
      }

      const estudiantesValidos = matricula.estudiantes.every(e => 
        e.codigo && e.nombre && e.documento && e.correo
      );

      if (!estudiantesValidos) {
        return res.status(400).json({ 
          error: `Todos los estudiantes del grupo ${matricula.codigo_materia}-${matricula.nombre_grupo} deben tener código, nombre, documento y correo` 
        });
      }
    }

    // Generar ID único para el progreso
    const progressId = `progress_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Calcular total de estudiantes
    const totalEstudiantes = matriculas.reduce((sum, m) => sum + m.estudiantes.length, 0);

    // Crear progreso inicial
    progressService.createProgress(progressId, totalEstudiantes);

    console.log(`🚀 Iniciando matrícula masiva - Progress ID: ${progressId}`);
    console.log(`📊 Total de estudiantes: ${totalEstudiantes} en ${matriculas.length} grupo(s)`);

    // Iniciar proceso en background (no bloqueante)
    setImmediate(async () => {
      try {
        await GrupoUsuarioService.matricularEstudiantesMasivamente(matriculas, progressId);
        console.log(`✅ Matrícula completada - Progress ID: ${progressId}`);
      } catch (error) {
        console.error(`❌ Error en proceso de matrícula - Progress ID: ${progressId}`, error);
        progressService.failProgress(progressId, `Error: ${error.message}`);
      }
    });

    // Responder inmediatamente con el ID de progreso (202 Accepted)
    return res.status(202).json({
      ok: true,
      mensaje: "Proceso de matrícula iniciado",
      progressId: progressId,
      totalEstudiantes: totalEstudiantes,
      totalGrupos: matriculas.length
    });

  } catch (error) {
    console.error("Error en matrícula masiva de estudiantes:", error);
    return res.status(500).json({
      error: "Error al procesar la matrícula masiva de estudiantes",
      detalle: error.message
    });
  }
}


async function activarEstadoEnGrupo(req, res) {
  const { codigo_usuario, codigo_materia, nombre_grupo, periodo, anio, clave_acceso } = req.body;

  try {
    const resultado = await GrupoUsuarioService.activarEstadoEnGrupo(
      codigo_usuario,
      codigo_materia,
      nombre_grupo,
      periodo,
      anio,
      clave_acceso
    );

    res.status(200).json(resultado);
  } catch (error) {
    console.error("❌ Error en activarEstadoEnGrupo:", error);
    res.status(400).json({ error: error.message });
  }
}

async function listarParticipantesGrupo(req, res) {
    const { codigo_materia, nombre_grupo, periodo, anio } = req.query;
    try {
        const resultado = await GrupoUsuarioService.listarParticipantesGrupo(
            codigo_materia,
            nombre_grupo,
            periodo,
            anio
        );
        res.status(200).json(resultado);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
}

export default { matricularEstudiantesMasivamente, activarEstadoEnGrupo, listarParticipantesGrupo };