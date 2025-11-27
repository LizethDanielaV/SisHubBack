import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API Dashboard - Sistema de Gestión de Proyectos',
      version: '1.0.0',
      description: 'Documentación completa de la API del Dashboard de Administrador para la gestión de proyectos académicos',
      contact: {
        name: 'Equipo de Desarrollo',
      }
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Servidor de Desarrollo'
      },
      {
        url: 'https://sishubbe-production.up.railway.app',
        description: 'Servidor de Producción'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Ingrese su token JWT'
        }
      },
      responses: {
        UnauthorizedError: {
          description: 'Token de acceso faltante o inválido',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  ok: { type: 'boolean', example: false },
                  message: { type: 'string', example: 'No autorizado' }
                }
              }
            }
          }
        },
        ForbiddenError: {
          description: 'No tiene permisos para acceder a este recurso',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  ok: { type: 'boolean', example: false },
                  message: { type: 'string', example: 'Acceso prohibido - Requiere rol de Administrador' }
                }
              }
            }
          }
        },
        ServerError: {
          description: 'Error interno del servidor',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  ok: { type: 'boolean', example: false },
                  message: { type: 'string', example: 'Error interno del servidor' },
                  error: { type: 'string', example: 'Descripción del error' }
                }
              }
            }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ],
    tags: [
      {
        name: 'Dashboard - Gráficos',
        description: 'Endpoints para obtener datos para visualización en gráficos'
      },
      {
        name: 'Dashboard - Tags/Métricas',
        description: 'Endpoints para obtener métricas y estadísticas puntuales'
      },
      {
        name: 'Dashboard - Resumen',
        description: 'Endpoint para obtener todos los datos del dashboard en una sola petición'
      }
    ]
  },
  apis: ['./src/routes/DashboardRoutes.js'] 
};

const swaggerSpec = swaggerJsdoc(options);

export { swaggerUi, swaggerSpec };