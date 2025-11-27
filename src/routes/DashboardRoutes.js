import { Router } from "express";
import DashboardController from "../controllers/DashboardController.js";

const router = Router();

/**
 * @swagger
 * /api/dashboard/graph/proyectos-semestre:
 *   get:
 *     summary: Obtener proyectos por semestre
 *     description: Retorna la cantidad de proyectos creados agrupados por semestre académico
 *     tags: [Dashboard - Gráficos]
 *     responses:
 *       200:
 *         description: Lista de proyectos por semestre
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       semester:
 *                         type: string
 *                         example: "2024-1"
 *                       total:
 *                         type: integer
 *                         example: 15
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get("/graph/proyectos-semestre", DashboardController.obtenerProyectosPorSemestre);

/**
 * @swagger
 * /api/dashboard/graph/porcentaje-roles:
 *   get:
 *     summary: Obtener porcentaje de roles
 *     description: Retorna la distribución porcentual de usuarios activos por rol
 *     tags: [Dashboard - Gráficos]
 *     responses:
 *       200:
 *         description: Distribución de roles
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       rol:
 *                         type: string
 *                         example: "ESTUDIANTE"
 *                       cantidad:
 *                         type: integer
 *                         example: 150
 *                       porcentaje:
 *                         type: string
 *                         example: "75.00"
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get("/graph/porcentaje-roles", DashboardController.obtenerPorcentajeRoles);

/**
 * @swagger
 * /api/dashboard/graph/tendencia-tecnologias:
 *   get:
 *     summary: Obtener tendencia de tecnologías
 *     description: Retorna las 10 tecnologías más utilizadas en proyectos
 *     tags: [Dashboard - Gráficos]
 *     responses:
 *       200:
 *         description: Top 10 tecnologías
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       tecnologia:
 *                         type: string
 *                         example: "React"
 *                       cantidad:
 *                         type: integer
 *                         example: 45
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get("/graph/tendencia-tecnologias", DashboardController.obtenerTendenciaTecnologias);

/**
 * @swagger
 * /api/dashboard/graph/tendencia-lineas:
 *   get:
 *     summary: Obtener tendencia de líneas de investigación
 *     description: Retorna las 10 líneas de investigación más trabajadas
 *     tags: [Dashboard - Gráficos]
 *     responses:
 *       200:
 *         description: Top 10 líneas de investigación
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       linea:
 *                         type: string
 *                         example: "Inteligencia Artificial"
 *                       cantidad:
 *                         type: integer
 *                         example: 28
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get("/graph/tendencia-lineas", DashboardController.obtenerTendenciaLineasInvestigacion);

/**
 * @swagger
 * /api/dashboard/graph/materias-proyectos:
 *   get:
 *     summary: Obtener materias con más proyectos
 *     description: Retorna las 10 materias con mayor cantidad de proyectos asignados
 *     tags: [Dashboard - Gráficos]
 *     responses:
 *       200:
 *         description: Top 10 materias
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       codigo_materia:
 *                         type: string
 *                         example: "1234567"
 *                       nombre_materia:
 *                         type: string
 *                         example: "Proyecto de Grado I"
 *                       cantidad:
 *                         type: integer
 *                         example: 45
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get("/graph/materias-proyectos", DashboardController.obtenerMateriasConMasProyectos);

/**
 * @swagger
 * /api/dashboard/graph/proyectos-estado:
 *   get:
 *     summary: Obtener proyectos por estado
 *     description: Retorna la distribución de proyectos según su estado actual
 *     tags: [Dashboard - Gráficos]
 *     responses:
 *       200:
 *         description: Proyectos agrupados por estado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       estado:
 *                         type: string
 *                         example: "EN_CURSO"
 *                       cantidad:
 *                         type: integer
 *                         example: 35
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get("/graph/proyectos-estado", DashboardController.obtenerProyectosPorEstado);

/**
 * @swagger
 * /api/dashboard/graph/proyectos-alcance:
 *   get:
 *     summary: Obtener proyectos por tipo de alcance
 *     description: Retorna la cantidad de proyectos agrupados por tipo de alcance
 *     tags: [Dashboard - Gráficos]
 *     responses:
 *       200:
 *         description: Proyectos agrupados por alcance
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       tipo_alcance:
 *                         type: string
 *                         example: "Investigativo"
 *                       cantidad:
 *                         type: integer
 *                         example: 45
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get("/graph/proyectos-alcance", DashboardController.obtenerProyectosPorTipoAlcance);

/**
 * @swagger
 * /api/dashboard/graph/entregables-tipo:
 *   get:
 *     summary: Obtener entregables por tipo
 *     description: Retorna el total de entregables agrupados por tipo
 *     tags: [Dashboard - Gráficos]
 *     responses:
 *       200:
 *         description: Entregables agrupados por tipo
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       tipo:
 *                         type: string
 *                         example: "DOCUMENTO"
 *                       cantidad:
 *                         type: integer
 *                         example: 125
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get("/graph/entregables-tipo", DashboardController.obtenerEntregablesPorTipo);

/**
 * @swagger
 * /api/dashboard/graph/ideas-estado:
 *   get:
 *     summary: Obtener ideas por estado
 *     description: Retorna la distribución de ideas según su estado
 *     tags: [Dashboard - Gráficos]
 *     responses:
 *       200:
 *         description: Ideas agrupadas por estado
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       estado:
 *                         type: string
 *                         example: "APROBADO"
 *                       cantidad:
 *                         type: integer
 *                         example: 52
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get("/graph/ideas-estado", DashboardController.obtenerIdeasPorEstado);

/**
 * @swagger
 * /api/dashboard/graph/actividad-reciente:
 *   get:
 *     summary: Obtener actividad reciente
 *     description: Retorna la actividad de creación de proyectos en los últimos 6 meses
 *     tags: [Dashboard - Gráficos]
 *     responses:
 *       200:
 *         description: Actividad mensual
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       mes:
 *                         type: string
 *                         example: "2024-09"
 *                       cantidad:
 *                         type: integer
 *                         example: 12
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get("/graph/actividad-reciente", DashboardController.obtenerActividadReciente);

/**
 * @swagger
 * /api/dashboard/graph/top-lideres:
 *   get:
 *     summary: Obtener top líderes
 *     description: Retorna los 10 líderes con más proyectos liderados
 *     tags: [Dashboard - Gráficos]
 *     responses:
 *       200:
 *         description: Top 10 líderes
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       codigo_usuario:
 *                         type: string
 *                         example: "EST001"
 *                       nombre_usuario:
 *                         type: string
 *                         example: "Juan Pérez"
 *                       cantidad_proyectos:
 *                         type: integer
 *                         example: 5
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get("/graph/top-lideres", DashboardController.obtenerTopLideres);

/**
 * @swagger
 * /api/dashboard/tags/proyectos-completados:
 *   get:
 *     summary: Obtener proyectos completados
 *     description: Retorna la cantidad total de proyectos con estado CALIFICADO
 *     tags: [Dashboard - Tags/Métricas]
 *     responses:
 *       200:
 *         description: Cantidad de proyectos completados
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     cantidad:
 *                       type: integer
 *                       example: 28
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get("/tags/proyectos-completados", DashboardController.obtenerProyectosCompletados);

/**
 * @swagger
 * /api/dashboard/tags/proyectos-disponibles:
 *   get:
 *     summary: Obtener proyectos disponibles
 *     description: Retorna la cantidad de proyectos LIBRES disponibles en el banco de ideas
 *     tags: [Dashboard - Tags/Métricas]
 *     responses:
 *       200:
 *         description: Cantidad de proyectos disponibles
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     cantidad:
 *                       type: integer
 *                       example: 15
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get("/tags/proyectos-disponibles", DashboardController.obtenerProyectosDisponibles);

/**
 * @swagger
 * /api/dashboard/tags/promedio-integrantes:
 *   get:
 *     summary: Obtener promedio de integrantes
 *     description: Retorna estadísticas sobre integrantes de equipos activos
 *     tags: [Dashboard - Tags/Métricas]
 *     responses:
 *       200:
 *         description: Promedio de integrantes por equipo
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     promedio:
 *                       type: number
 *                       format: float
 *                       example: 3.45
 *                     total_equipos:
 *                       type: integer
 *                       example: 42
 *                     total_integrantes:
 *                       type: integer
 *                       example: 145
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get("/tags/promedio-integrantes", DashboardController.obtenerPromedioIntegrantesPorEquipo);

/**
 * @swagger
 * /api/dashboard/tags/estadisticas-grupos:
 *   get:
 *     summary: Obtener estadísticas de grupos
 *     description: Retorna información sobre grupos activos e inactivos
 *     tags: [Dashboard - Tags/Métricas]
 *     responses:
 *       200:
 *         description: Estadísticas de grupos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ok:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                       example: 85
 *                     activos:
 *                       type: integer
 *                       example: 62
 *                     inactivos:
 *                       type: integer
 *                       example: 23
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get("/tags/estadisticas-grupos", DashboardController.obtenerEstadisticasGrupos);


export default router;