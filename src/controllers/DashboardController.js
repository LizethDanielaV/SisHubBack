import DashboardService from "../services/DashboardService.js";

async function obtenerProyectosPorSemestre(req, res) {
    try {
        const data = await DashboardService.obtenerProyectosPorSemestre();
        res.status(200).json({
            ok: true,
            data
        });
    } catch (error) {
        console.error("Error en obtenerProyectosPorSemestre:", error);
        res.status(500).json({
            ok: false,
            message: "Error al obtener proyectos por semestre",
            error: error.message
        });
    }
}

async function obtenerPorcentajeRoles(req, res) {
    try {
        const data = await DashboardService.obtenerPorcentajeRoles();
        res.status(200).json({
            ok: true,
            data
        });
    } catch (error) {
        console.error("Error en obtenerPorcentajeRoles:", error);
        res.status(500).json({
            ok: false,
            message: "Error al obtener porcentaje de roles",
            error: error.message
        });
    }
}

async function obtenerTendenciaTecnologias(req, res) {
    try {
        const data = await DashboardService.obtenerTendenciaTecnologias();
        res.status(200).json({
            ok: true,
            data
        });
    } catch (error) {
        console.error("Error en obtenerTendenciaTecnologias:", error);
        res.status(500).json({
            ok: false,
            message: "Error al obtener tendencia de tecnologías",
            error: error.message
        });
    }
}

async function obtenerTendenciaLineasInvestigacion(req, res) {
    try {
        const data = await DashboardService.obtenerTendenciaLineasInvestigacion();
        res.status(200).json({
            ok: true,
            data
        });
    } catch (error) {
        console.error("Error en obtenerTendenciaLineasInvestigacion:", error);
        res.status(500).json({
            ok: false,
            message: "Error al obtener tendencia de líneas de investigación",
            error: error.message
        });
    }
}

async function obtenerMateriasConMasProyectos(req, res) {
    try {
        const data = await DashboardService.obtenerMateriasConMasProyectos();
        res.status(200).json({
            ok: true,
            data
        });
    } catch (error) {
        console.error("Error en obtenerMateriasConMasProyectos:", error);
        res.status(500).json({
            ok: false,
            message: "Error al obtener materias con más proyectos",
            error: error.message
        });
    }
}

async function obtenerProyectosCompletados(req, res) {
    try {
        const data = await DashboardService.obtenerProyectosCompletados();
        res.status(200).json({
            ok: true,
            data
        });
    } catch (error) {
        console.error("Error en obtenerProyectosCompletados:", error);
        res.status(500).json({
            ok: false,
            message: "Error al obtener proyectos completados",
            error: error.message
        });
    }
}

async function obtenerProyectosDisponibles(req, res) {
    try {
        const data = await DashboardService.obtenerProyectosDisponibles();
        res.status(200).json({
            ok: true,
            data
        });
    } catch (error) {
        console.error("Error en obtenerProyectosDisponibles:", error);
        res.status(500).json({
            ok: false,
            message: "Error al obtener proyectos disponibles",
            error: error.message
        });
    }
}

async function obtenerProyectosPorEstado(req, res) {
    try {
        const data = await DashboardService.obtenerProyectosPorEstado();
        res.status(200).json({
            ok: true,
            data
        });
    } catch (error) {
        console.error("Error en obtenerProyectosPorEstado:", error);
        res.status(500).json({
            ok: false,
            message: "Error al obtener proyectos por estado",
            error: error.message
        });
    }
}

async function obtenerProyectosPorTipoAlcance(req, res) {
    try {
        const data = await DashboardService.obtenerProyectosPorTipoAlcance();
        res.status(200).json({
            ok: true,
            data
        });
    } catch (error) {
        console.error("Error en obtenerProyectosPorTipoAlcance:", error);
        res.status(500).json({
            ok: false,
            message: "Error al obtener proyectos por tipo de alcance",
            error: error.message
        });
    }
}

async function obtenerPromedioIntegrantesPorEquipo(req, res) {
    try {
        const data = await DashboardService.obtenerPromedioIntegrantesPorEquipo();
        res.status(200).json({
            ok: true,
            data
        });
    } catch (error) {
        console.error("Error en obtenerPromedioIntegrantesPorEquipo:", error);
        res.status(500).json({
            ok: false,
            message: "Error al obtener promedio de integrantes",
            error: error.message
        });
    }
}

async function obtenerEntregablesPorTipo(req, res) {
    try {
        const data = await DashboardService.obtenerEntregablesPorTipo();
        res.status(200).json({
            ok: true,
            data
        });
    } catch (error) {
        console.error("Error en obtenerEntregablesPorTipo:", error);
        res.status(500).json({
            ok: false,
            message: "Error al obtener entregables por tipo",
            error: error.message
        });
    }
}

async function obtenerIdeasPorEstado(req, res) {
    try {
        const data = await DashboardService.obtenerIdeasPorEstado();
        res.status(200).json({
            ok: true,
            data
        });
    } catch (error) {
        console.error("Error en obtenerIdeasPorEstado:", error);
        res.status(500).json({
            ok: false,
            message: "Error al obtener ideas por estado",
            error: error.message
        });
    }
}

async function obtenerEstadisticasGrupos(req, res) {
    try {
        const data = await DashboardService.obtenerEstadisticasGrupos();
        res.status(200).json({
            ok: true,
            data
        });
    } catch (error) {
        console.error("Error en obtenerEstadisticasGrupos:", error);
        res.status(500).json({
            ok: false,
            message: "Error al obtener estadísticas de grupos",
            error: error.message
        });
    }
}

async function obtenerActividadReciente(req, res) {
    try {
        const data = await DashboardService.obtenerActividadReciente();
        res.status(200).json({
            ok: true,
            data
        });
    } catch (error) {
        console.error("Error en obtenerActividadReciente:", error);
        res.status(500).json({
            ok: false,
            message: "Error al obtener actividad reciente",
            error: error.message
        });
    }
}

async function obtenerTopLideres(req, res) {
    try {
        const data = await DashboardService.obtenerTopLideres();
        res.status(200).json({
            ok: true,
            data
        });
    } catch (error) {
        console.error("Error en obtenerTopLideres:", error);
        res.status(500).json({
            ok: false,
            message: "Error al obtener top líderes",
            error: error.message
        });
    }
}

export default {
    obtenerProyectosPorSemestre,
    obtenerPorcentajeRoles,
    obtenerTendenciaTecnologias,
    obtenerTendenciaLineasInvestigacion,
    obtenerMateriasConMasProyectos,
    obtenerProyectosCompletados,
    obtenerProyectosDisponibles,
    obtenerProyectosPorEstado,
    obtenerProyectosPorTipoAlcance,
    obtenerPromedioIntegrantesPorEquipo,
    obtenerEntregablesPorTipo,
    obtenerIdeasPorEstado,
    obtenerEstadisticasGrupos,
    obtenerActividadReciente,
    obtenerTopLideres
};