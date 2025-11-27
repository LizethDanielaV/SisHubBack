import Proyecto from "../models/Proyecto.js";
import Idea from "../models/Idea.js";
import Estado from "../models/Estado.js";
import Usuario from "../models/Usuario.js";
import Rol from "../models/Rol.js";
import TipoAlcance from "../models/TipoAlcance.js";
import Entregable from "../models/Entregable.js";
import Grupo from "../models/Grupo.js";
import Materia from "../models/Materia.js";
import Equipo from "../models/Equipo.js";
import IntegranteEquipo from "../models/IntegrantesEquipo.js";
import { Op } from 'sequelize';

function getSemester(dateStr) {
    const d = new Date(dateStr);
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    const day = d.getDate();

    // Primer semestre: Feb 10 → Jun 10
    if (
        (month > 2 && month < 6) ||
        (month === 2 && day >= 10) ||
        (month === 6 && day <= 10)
    ) {
        return `${year}-1`;
    }

    // Segundo semestre: Ago 10 → Dic 10
    if (
        (month > 8 && month < 12) ||
        (month === 8 && day >= 10) ||
        (month === 12 && day <= 10)
    ) {
        return `${year}-2`;
    }

    return null;
}

async function obtenerProyectosPorSemestre() {
    try {
        const proyectos = await Proyecto.findAll({
            attributes: ["fecha_creacion"]
        });

        const grouped = {};

        proyectos.forEach(p => {
            const semester = getSemester(p.fecha_creacion);
            if (!semester) return;

            grouped[semester] = (grouped[semester] || 0) + 1;
        });

        return Object.entries(grouped)
            .map(([semester, total]) => ({ semester, total }))
            .sort((a, b) => a.semester.localeCompare(b.semester));

    } catch (error) {
        throw new Error("Error al obtener proyectos por semestre: " + error.message);
    }
}

async function obtenerPorcentajeRoles() {
    try {
        const totalUsuarios = await Usuario.count({
            include: [{
                model: Estado,
                where: { descripcion: { [Op.ne]: 'INACTIVO' } }
            }]
        });

        if (totalUsuarios === 0) {
            return [];
        }

        const usuarios = await Usuario.findAll({
            include: [
                {
                    model: Rol,
                    attributes: ['descripcion']
                },
                {
                    model: Estado,
                    where: { descripcion: { [Op.ne]: 'INACTIVO' } }
                }
            ],
            attributes: ['codigo']
        });

        const rolesCounts = {};

        usuarios.forEach(u => {
            const rol = u.Rol?.descripcion || 'Sin Rol';
            rolesCounts[rol] = (rolesCounts[rol] || 0) + 1;
        });

        return Object.entries(rolesCounts).map(([rol, cantidad]) => ({
            rol,
            cantidad,
            porcentaje: ((cantidad / totalUsuarios) * 100).toFixed(2)
        }));

    } catch (error) {
        throw new Error("Error al obtener porcentaje de roles: " + error.message);
    }
}

async function obtenerTendenciaTecnologias() {
    try {
        const proyectos = await Proyecto.findAll({
            attributes: ["tecnologias", "fecha_creacion"]
        });

        const techCounts = {};

        proyectos.forEach(p => {
            if (!p.tecnologias) return;

            const techs = p.tecnologias
                .split(",")
                .map(t => t.trim())
                .filter(Boolean);

            techs.forEach(tech => {
                techCounts[tech] = (techCounts[tech] || 0) + 1;
            });
        });

        return Object.entries(techCounts)
            .map(([tecnologia, cantidad]) => ({ tecnologia, cantidad }))
            .sort((a, b) => b.cantidad - a.cantidad)
            .slice(0, 10); // Top 10 tecnologías

    } catch (error) {
        throw new Error("Error al obtener tendencia de tecnologías: " + error.message);
    }
}

async function obtenerTendenciaLineasInvestigacion() {
    try {
        const proyectos = await Proyecto.findAll({
            attributes: ["linea_investigacion", "fecha_creacion"]
        });

        const lineasCounts = {};

        proyectos.forEach(p => {
            if (!p.linea_investigacion) return;

            const lineas = p.linea_investigacion
                .split(",")
                .map(l => l.trim())
                .filter(Boolean);

            lineas.forEach(linea => {
                lineasCounts[linea] = (lineasCounts[linea] || 0) + 1;
            });
        });

        return Object.entries(lineasCounts)
            .map(([linea, cantidad]) => ({ linea, cantidad }))
            .sort((a, b) => b.cantidad - a.cantidad)
            .slice(0, 10); // Top 10 líneas

    } catch (error) {
        throw new Error("Error al obtener tendencia de líneas de investigación: " + error.message);
    }
}

async function obtenerMateriasConMasProyectos() {
    try {
        const proyectos = await Proyecto.findAll({
            include: [
                {
                    model: Idea,
                    as: "Idea",
                    attributes: ["codigo_materia"],
                    where: {
                        codigo_materia: { [Op.ne]: null }
                    },
                    include: [
                        {
                            model: Estado,
                            as: "Estado",
                            where: { descripcion: { [Op.ne]: 'LIBRE' } }
                        }
                    ]
                }
            ],
            attributes: ["id_proyecto"]
        });

        const materiasCounts = {};

        for (const p of proyectos) {
            const codigoMateria = p.Idea?.codigo_materia;
            if (!codigoMateria) continue;

            materiasCounts[codigoMateria] = (materiasCounts[codigoMateria] || 0) + 1;
        }

        // Obtener nombres de las materias
        const materiasData = await Promise.all(
            Object.entries(materiasCounts).map(async ([codigo, cantidad]) => {
                const materia = await Materia.findByPk(codigo, {
                    attributes: ['nombre']
                });
                return {
                    codigo_materia: codigo,
                    nombre_materia: materia?.nombre || 'Desconocida',
                    cantidad
                };
            })
        );

        return materiasData
            .sort((a, b) => b.cantidad - a.cantidad)
            .slice(0, 10); // Top 10 materias

    } catch (error) {
        throw new Error("Error al obtener materias con más proyectos: " + error.message);
    }
}

async function obtenerProyectosCompletados() {
    try {
        const estadoCalificado = await Estado.findOne({
            where: { descripcion: "CALIFICADO" }
        });

        if (!estadoCalificado) {
            return { cantidad: 0 };
        }

        const cantidad = await Proyecto.count({
            where: { id_estado: estadoCalificado.id_estado }
        });

        return { cantidad };

    } catch (error) {
        throw new Error("Error al obtener proyectos completados: " + error.message);
    }
}

async function obtenerProyectosDisponibles() {
    try {
        const estadoLibre = await Estado.findOne({
            where: { descripcion: "LIBRE" }
        });

        const estadoCalificado = await Estado.findOne({
            where: { descripcion: "CALIFICADO" }
        });

        if (!estadoLibre || !estadoCalificado) {
            return { cantidad: 0 };
        }

        const cantidad = await Idea.count({
            where: { id_estado: estadoLibre.id_estado },
            include: [
                {
                    model: Proyecto,
                    as: "proyectos",
                    required: true,
                    where: { id_estado: estadoCalificado.id_estado }
                }
            ]
        });

        return { cantidad };

    } catch (error) {
        throw new Error("Error al obtener proyectos disponibles: " + error.message);
    }
}

async function obtenerProyectosPorEstado() {
    try {
        const proyectos = await Proyecto.findAll({
            include: [
                {
                    model: Estado,
                    attributes: ['descripcion']
                }
            ],
            attributes: ['id_proyecto', 'id_estado']
        });

        const estadosCounts = {};

        proyectos.forEach(p => {
            const estado = p.Estado?.descripcion || 'Sin Estado';
            estadosCounts[estado] = (estadosCounts[estado] || 0) + 1;
        });

        return Object.entries(estadosCounts)
            .map(([estado, cantidad]) => ({ estado, cantidad }))
            .sort((a, b) => b.cantidad - a.cantidad);

    } catch (error) {
        throw new Error("Error al obtener proyectos por estado: " + error.message);
    }
}

async function obtenerProyectosPorTipoAlcance() {
    try {
        const proyectos = await Proyecto.findAll({
            include: [
                {
                    model: TipoAlcance,
                    as: "Tipo_alcance",
                    attributes: ['nombre']
                }
            ],
            attributes: ['id_proyecto']
        });

        const alcanceCounts = {};

        proyectos.forEach(p => {
            const alcance = p.Tipo_alcance?.nombre || 'Sin Alcance';
            alcanceCounts[alcance] = (alcanceCounts[alcance] || 0) + 1;
        });

        return Object.entries(alcanceCounts)
            .map(([tipo_alcance, cantidad]) => ({ tipo_alcance, cantidad }))
            .sort((a, b) => b.cantidad - a.cantidad);

    } catch (error) {
        throw new Error("Error al obtener proyectos por tipo de alcance: " + error.message);
    }
}

async function obtenerPromedioIntegrantesPorEquipo() {
    try {
        const equipos = await Equipo.findAll({
            where: { estado: true },
            include: [
                {
                    model: IntegranteEquipo,
                    as: "Integrante_Equipos",
                    attributes: ['id_integrante_equipo']
                }
            ],
            attributes: ['id_equipo']
        });

        if (equipos.length === 0) {
            return { promedio: 0, total_equipos: 0, total_integrantes: 0 };
        }

        let totalIntegrantes = 0;

        equipos.forEach(equipo => {
            totalIntegrantes += equipo.Integrante_Equipos?.length || 0;
        });

        const promedio = (totalIntegrantes / equipos.length).toFixed(2);

        return {
            promedio: parseFloat(promedio),
            total_equipos: equipos.length,
            total_integrantes: totalIntegrantes
        };

    } catch (error) {
        throw new Error("Error al obtener promedio de integrantes: " + error.message);
    }
}

async function obtenerEntregablesPorTipo() {
    try {
        const entregables = await Entregable.findAll({
            attributes: ['tipo']
        });

        const tiposCounts = {};

        entregables.forEach(e => {
            const tipo = e.tipo?.toUpperCase() || 'Sin Tipo';
            tiposCounts[tipo] = (tiposCounts[tipo] || 0) + 1;
        });

        return Object.entries(tiposCounts)
            .map(([tipo, cantidad]) => ({ tipo, cantidad }))
            .sort((a, b) => b.cantidad - a.cantidad);

    } catch (error) {
        throw new Error("Error al obtener entregables por tipo: " + error.message);
    }
}

async function obtenerIdeasPorEstado() {
    try {
        const ideas = await Idea.findAll({
            include: [
                {
                    model: Estado,
                    as: "Estado",
                    attributes: ['descripcion']
                }
            ],
            attributes: ['id_idea']
        });

        const estadosCounts = {};

        ideas.forEach(i => {
            const estado = i.Estado?.descripcion || 'Sin Estado';
            estadosCounts[estado] = (estadosCounts[estado] || 0) + 1;
        });

        return Object.entries(estadosCounts)
            .map(([estado, cantidad]) => ({ estado, cantidad }))
            .sort((a, b) => b.cantidad - a.cantidad);

    } catch (error) {
        throw new Error("Error al obtener ideas por estado: " + error.message);
    }
}

async function obtenerEstadisticasGrupos() {
    try {
        const totalGrupos = await Grupo.count();
        const gruposActivos = await Grupo.count({ where: { estado: true } });
        const gruposInactivos = totalGrupos - gruposActivos;

        return {
            total: totalGrupos,
            activos: gruposActivos,
            inactivos: gruposInactivos
        };

    } catch (error) {
        throw new Error("Error al obtener estadísticas de grupos: " + error.message);
    }
}

async function obtenerActividadReciente() {
    try {
        const fechaHace6Meses = new Date();
        fechaHace6Meses.setMonth(fechaHace6Meses.getMonth() - 6);

        const proyectos = await Proyecto.findAll({
            where: {
                fecha_creacion: {
                    [Op.gte]: fechaHace6Meses
                }
            },
            attributes: ['fecha_creacion']
        });

        // Agrupar por mes
        const mesesCounts = {};

        proyectos.forEach(p => {
            const fecha = new Date(p.fecha_creacion);
            const mes = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
            mesesCounts[mes] = (mesesCounts[mes] || 0) + 1;
        });

        return Object.entries(mesesCounts)
            .map(([mes, cantidad]) => ({ mes, cantidad }))
            .sort((a, b) => a.mes.localeCompare(b.mes));

    } catch (error) {
        throw new Error("Error al obtener actividad reciente: " + error.message);
    }
}

async function obtenerTopLideres() {
    try {
        const lideres = await IntegranteEquipo.findAll({
            where: { es_lider: true },
            include: [
                {
                    model: Usuario,
                    as: "Usuario",
                    attributes: ['codigo', 'nombre'],
                    include: [
                        {
                            model: Estado,
                            where: { descripcion: 'ACTIVO' }
                        }
                    ]
                },
                {
                    model: Equipo,
                    as: "equipo",
                    where: { estado: true },
                    attributes: ['id_equipo']
                }
            ],
            attributes: ['codigo_usuario', 'id_equipo']
        });

        const lideresCounts = {};

        lideres.forEach(l => {
            const codigo = l.Usuario?.codigo;
            const nombre = l.Usuario?.nombre;
            if (!codigo) return;

            if (!lideresCounts[codigo]) {
                lideresCounts[codigo] = { nombre, cantidad: 0 };
            }
            lideresCounts[codigo].cantidad++;
        });

        return Object.entries(lideresCounts)
            .map(([codigo, data]) => ({
                codigo_usuario: codigo,
                nombre_usuario: data.nombre,
                cantidad_proyectos: data.cantidad
            }))
            .sort((a, b) => b.cantidad_proyectos - a.cantidad_proyectos)
            .slice(0, 10); // Top 10

    } catch (error) {
        throw new Error("Error al obtener top líderes: " + error.message);
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