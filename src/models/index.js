// src/models/index.js

// Modelos base
import "./Rol.js";
import "./Estado.js";
import "./Usuario.js";
import "./Area.js";
import "./Materia.js";
import "./Grupo.js";
import "./GrupoUsuario.js";

// Modelos relacionados con ideas, proyectos y entregables
import "./Idea.js";
import "./Proyecto.js";
import "./Entregable.js";
import "./HistorialIdea.js";
import "./HistorialProyecto.js";
import "./HistorialEntregable.js";

// Modelos de equipos y actividades
import "./Equipo.js";
import "./Actividad.js";

// Modelos de comunicación y notificación
import "./Mensaje.js";
import "./Notificacion.js";

console.log("✅ Todos los modelos cargados correctamente");
