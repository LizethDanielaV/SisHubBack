import Usuario from '../models/Usuario.js';
import { admin } from "../firebaseAdmin.js";
import { Op } from 'sequelize';
import Rol from '../models/Rol.js';
import Estado from '../models/Estado.js';
import { progressService } from "../services/progressService.js";
import IntegranteEquipo from '../models/IntegrantesEquipo.js';
import Equipo from '../models/Equipo.js';
import Proyecto from '../models/Proyecto.js';
import HistorialProyecto from '../models/HistorialProyecto.js';
import Idea from '../models/Idea.js';
import Groq from 'groq-sdk';
import dotenv from "dotenv";
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

async function cargarDocentesMasivamente(docentes, progressId = null) {
  const resultados = {
    exitosos: [],
    errores: []
  };

  const BATCH_SIZE = 10;
  let docentesProcesados = 0;

  try {
    // 1. Obtener rol y estado una sola vez
    if (progressId) {
      progressService.updateProgress(progressId, 0, 'Verificando configuración del sistema...');
    }

    const [rolDocente, estadoHabilitado] = await Promise.all([
      Rol.findOne({ where: { descripcion: "DOCENTE" } }),
      Estado.findOne({ where: { descripcion: "HABILITADO" } })
    ]);

    if (!rolDocente || !estadoHabilitado) {
      throw new Error("Configuración incompleta: Rol DOCENTE o Estado HABILITADO no encontrado");
    }

    // 2. Verificar duplicados en BD de una sola vez
    if (progressId) {
      progressService.updateProgress(progressId, 0, 'Verificando duplicados...');
    }

    const codigos = docentes.map(d => d.codigo);
    const documentos = docentes.map(d => d.documento);
    const correos = docentes.map(d => d.correo);

    const usuariosExistentes = await Usuario.findAll({
      where: {
        [Op.or]: [
          { codigo: { [Op.in]: codigos } },
          { documento: { [Op.in]: documentos } },
          { correo: { [Op.in]: correos } }
        ]
      }
    });

    // Crear un Set para búsqueda rápida
    const codigosExistentes = new Set(usuariosExistentes.map(u => u.codigo));
    const documentosExistentes = new Set(usuariosExistentes.map(u => u.documento));
    const correosExistentes = new Set(usuariosExistentes.map(u => u.correo));

    // 3. Procesar docentes en lotes
    for (let i = 0; i < docentes.length; i += BATCH_SIZE) {
      const batch = docentes.slice(i, i + BATCH_SIZE);
      const batchEnd = Math.min(i + BATCH_SIZE, docentes.length);

      if (progressId) {
        progressService.updateProgress(
          progressId,
          docentesProcesados,
          `Procesando docentes (${i + 1}-${batchEnd} de ${docentes.length})...`
        );
      }

      await Promise.all(batch.map(async (docente) => {
        let userRecord = null;

        try {
          // Verificar duplicados
          if (codigosExistentes.has(docente.codigo)) {
            resultados.errores.push({
              docente,
              error: `Ya existe un usuario con el código ${docente.codigo}`
            });

            if (progressId) {
              progressService.addError(progressId, {
                codigo: docente.codigo,
                nombre: docente.nombre,
                error: "Código ya registrado"
              });
            }
            docentesProcesados++;
            return;
          }

          if (documentosExistentes.has(docente.documento)) {
            resultados.errores.push({
              docente,
              error: `Ya existe un usuario con el documento ${docente.documento}`
            });

            if (progressId) {
              progressService.addError(progressId, {
                codigo: docente.codigo,
                nombre: docente.nombre,
                error: "Documento ya registrado"
              });
            }
            docentesProcesados++;
            return;
          }

          if (correosExistentes.has(docente.correo)) {
            resultados.errores.push({
              docente,
              error: `Ya existe un usuario con el correo ${docente.correo}`
            });

            if (progressId) {
              progressService.addError(progressId, {
                codigo: docente.codigo,
                nombre: docente.nombre,
                error: "Correo ya registrado"
              });
            }
            docentesProcesados++;
            return;
          }

          // Crear usuario en Firebase
          try {
            userRecord = await admin.auth().createUser({
              email: docente.correo,
              emailVerified: true,
              displayName: docente.nombre,
              disabled: false
            });
          } catch (firebaseError) {
            if (firebaseError.code === 'auth/email-already-exists') {
              // Intentar obtener el usuario existente
              try {
                userRecord = await admin.auth().getUserByEmail(docente.correo);

                // Verificar si ya está en nuestra BD
                const usuarioConUid = await Usuario.findOne({
                  where: { uid_firebase: userRecord.uid }
                });

                if (usuarioConUid) {
                  resultados.errores.push({
                    docente,
                    error: `El correo ${docente.correo} ya está registrado en el sistema`
                  });

                  if (progressId) {
                    progressService.addError(progressId, {
                      codigo: docente.codigo,
                      nombre: docente.nombre,
                      error: "Correo ya registrado en Firebase"
                    });
                  }
                  docentesProcesados++;
                  return;
                }
              } catch (getUserError) {
                resultados.errores.push({
                  docente,
                  error: `Error al verificar correo en Firebase: ${getUserError.message}`
                });

                if (progressId) {
                  progressService.addError(progressId, {
                    codigo: docente.codigo,
                    nombre: docente.nombre,
                    error: `Error Firebase: ${getUserError.message}`
                  });
                }
                docentesProcesados++;
                return;
              }
            } else {
              resultados.errores.push({
                docente,
                error: `Error en Firebase: ${firebaseError.message}`
              });

              if (progressId) {
                progressService.addError(progressId, {
                  codigo: docente.codigo,
                  nombre: docente.nombre,
                  error: `Firebase: ${firebaseError.message}`
                });
              }
              docentesProcesados++;
              return;
            }
          }

          // Crear usuario en la BD
          const nuevoUsuario = await Usuario.create({
            codigo: docente.codigo,
            nombre: docente.nombre,
            documento: docente.documento,
            correo: docente.correo,
            telefono: docente.telefono || null,
            uid_firebase: userRecord.uid,
            id_rol: rolDocente.id_rol,
            id_estado: estadoHabilitado.id_estado
          });

          // Establecer custom claims en Firebase
          await admin.auth().setCustomUserClaims(userRecord.uid, {
            role: "DOCENTE",
            id_rol: rolDocente.id_rol,
            estado: "HABILITADO"
          });

          // Agregar a Sets para evitar duplicados en siguientes iteraciones
          codigosExistentes.add(docente.codigo);
          documentosExistentes.add(docente.documento);
          correosExistentes.add(docente.correo);

          resultados.exitosos.push({
            codigo: nuevoUsuario.codigo,
            nombre: nuevoUsuario.nombre,
            correo: nuevoUsuario.correo,
            uid: userRecord.uid
          });

          if (progressId) {
            progressService.addSuccess(progressId, {
              codigo: nuevoUsuario.codigo,
              nombre: nuevoUsuario.nombre,
              accion: 'Docente creado exitosamente'
            });
          }

          docentesProcesados++;

        } catch (error) {
          // Si algo falla, limpiar Firebase
          if (userRecord?.uid) {
            try {
              await admin.auth().deleteUser(userRecord.uid);
            } catch (cleanupError) {
              console.error("Error al limpiar Firebase:", cleanupError);
            }
          }

          resultados.errores.push({
            docente,
            error: error.message || "Error desconocido al procesar docente"
          });

          if (progressId) {
            progressService.addError(progressId, {
              codigo: docente.codigo,
              nombre: docente.nombre,
              error: error.message || "Error desconocido"
            });
          }

          docentesProcesados++;
        }
      }));
    }

    if (progressId) {
      progressService.completeProgress(
        progressId,
        `✓ Proceso completado. ${resultados.exitosos.length} docente(s) cargado(s) correctamente`
      );
    }

  } catch (error) {
    console.error("Error en carga masiva de docentes:", error);

    if (progressId) {
      progressService.failProgress(progressId, error.message);
    }

    throw error;
  }

  return resultados;
}

async function listarDocentes() {
  try {
    const docentes = await Usuario.findAll({
      where: { id_rol: '2' },
      attributes: ['codigo', 'nombre', 'correo']
    });
    return docentes;
  } catch (error) {
    throw new Error("Error al listar docentes: " + error.message);
  }
}

async function listarEstudiantes() {
  try {
    const estudiantes = await Usuario.findAll({
      where: { id_rol: '3' },
      attributes: ['codigo', 'nombre', 'correo', "uid_firebase"],
      include: [
        {
          model: IntegranteEquipo,
          include: [
            {
              model: Equipo,
              include: [
                {
                  model: HistorialProyecto,
                  include: [{
                    model: Proyecto,
                    attributes: ["id_proyecto", "tecnologias", "linea_investigacion"],
                    include: [{
                      model: Idea,
                      attributes: ["titulo", "objetivo_general"]
                    }]
                  }]
                },
              ],
            },
          ],
        },
      ],
    });
    
 // Procesar cada estudiante para extraer la información requerida
    // USAR Promise.all() para manejar operaciones asíncronas dentro del map
    const estudiantesConInfo = await Promise.all(
      estudiantes.map(async (estudiante) => {
        // Convertir a JSON plano
        const estudianteJSON = estudiante.toJSON();
        
        // Extraer tecnologías usando tu función existente
        const tecnologias = obtenerTecnologiasEstudiante(estudianteJSON);
        
        // Extraer líneas de investigación usando tu función existente
        const lineasInvestigacion = obtenerLineasEstudiante(estudianteJSON);
        
        // Extraer roles (líder o no)
        const roles = obtenerRolesEstudiante(estudianteJSON);

        // Obtener foto de perfil (operación asíncrona)
        const fotoPerfil = await obtenerFotoPerfil(estudianteJSON.uid_firebase);
        
        return {
          codigo: estudianteJSON.codigo,
          nombre: estudianteJSON.nombre,
          correo: estudianteJSON.correo,
          tecnologias: tecnologias,
          lineasInvestigacion: lineasInvestigacion,
          roles: roles,
          fotoPerfil: fotoPerfil.success ? fotoPerfil.photoURL : null
        };
      })
    );

    return estudiantesConInfo;
  } catch (error) {
    throw new Error("Error al listar estudiantes: " + error.message);
  }
}

// Función auxiliar para extraer roles
function obtenerRolesEstudiante(data) {
  const rolesInfo = {
    esLider: false,
    cantidadVecesLider: 0,
    cantidadVecesMiembro: 0
  };

  data.Integrante_Equipos.forEach(integrante => {
    if (integrante.es_lider) {
      rolesInfo.esLider = true;
      rolesInfo.cantidadVecesLider++;
    } else {
      rolesInfo.cantidadVecesMiembro++;
    }
  });

  return rolesInfo;
}

async function buscarEstudiantePorCodigo(codigo) {
  try {
    const estudiante = await Usuario.findOne({
      where: { codigo },
      include: [
        {
          model: Rol,
          attributes: ["descripcion"],
          where: { descripcion: "ESTUDIANTE" }
        },
        {
          model: Estado,
          attributes: ["descripcion"]
        }
      ],
      attributes: ["codigo", "nombre", "documento", "correo", "telefono"]
    });

    if (!estudiante) {
      return null;
    }

    return estudiante;
  } catch (error) {
    throw new Error("Error al buscar estudiante por código: " + error.message);
  }
}

async function obtenerFotoPerfil(uid_firebase) {
  try {
    const userRecord = await admin.auth().getUser(uid_firebase);
    return {
      success: true,
      photoURL: userRecord.photoURL || null,
      displayName: userRecord.displayName
    };
  } catch (error) {
    return {
      success: false,
      message: 'Usuario no encontrado'
    };
  }
}

async function informacionPerfilUsuario(codigo) {
  if (!codigo) {
    throw new Error("El codigo no puede estar vacio");
  }
  try {
    const infoBasica = await Usuario.findOne({
      where: { codigo: codigo },
      attributes: ["codigo", "nombre", "correo", "documento", "uid_firebase"],
      include: [
        {
          model: IntegranteEquipo,
          include: [
            {
              model: Equipo,
              include: [
                {
                  model: HistorialProyecto,
                  include: [{
                    model: Proyecto,
                    attributes: ["id_proyecto", "tecnologias", "linea_investigacion"],
                    include: [{
                      model: Idea,
                      attributes: ["titulo", "objetivo_general"]
                    }]
                  }]
                },
              ],
            },
          ],
        },
      ],
    })
    //contar la cantidad de proyectos
    const numeroProyectos = contarProyectosEstudiante(infoBasica);
    //contar cantidad de veces lider
    const vecesLider = infoBasica.Integrante_Equipos.filter(eq => eq.es_lider).length;

    //traer tecnologias que ha usado
    const tecnologiasUsadas = contarTecnologiasEstudiante(infoBasica);
    //traer lineas usadas
    const lineas = obtenerLineasEstudiante(infoBasica);
    //informacion añio, peridoo y proyectos 
    const proyectosPorPeriodo = obtenerProyectosPorPeriodo(infoBasica);
    //generar resumen del perfil 
    const resumen = await generarResumenPreferenciasEstudiante(infoBasica);

    const fotoPerfil = await obtenerFotoPerfil(infoBasica.uid_firebase);

    // Construir objeto plano con solo lo que se requiere
    const resultadoInfoBasica = {
      codigo: infoBasica.codigo,
      nombre: infoBasica.nombre,
      correo: infoBasica.correo,
      documento: infoBasica.documento,
      cantidadVecesLider: vecesLider,
      cantidadProyectos: numeroProyectos,
      tecnologias: tecnologiasUsadas,
      lineasInvestigacion: lineas,
      proyectosPeriodo: proyectosPorPeriodo,
      resumenPerfil: resumen,
      fotoPerfil: fotoPerfil.success ? fotoPerfil.photoURL : null
    };

    return resultadoInfoBasica;
  } catch (error) {
    throw error;
  }
}

function contarProyectosEstudiante(data) {
  const proyectosUnicos = new Set();

  data.Integrante_Equipos.forEach(integrante => {
    integrante.equipo.Historial_Proyectos.forEach(historial => {
      proyectosUnicos.add(historial.id_proyecto);
    });
  });

  return proyectosUnicos.size;
}

function contarTecnologiasEstudiante(data) {
  const tecnologiasCount = {};
  const proyectosVistos = new Set(); // Para contar cada proyecto solo una vez

  data.Integrante_Equipos.forEach(integrante => {
    integrante.equipo.Historial_Proyectos.forEach(historial => {
      const proyecto = historial.proyecto;
      
      // Solo contar cada proyecto una vez (evitar duplicados)
      if (proyecto && !proyectosVistos.has(proyecto.id_proyecto)) {
        proyectosVistos.add(proyecto.id_proyecto);
        
        if (proyecto.tecnologias) {
          // Dividir las tecnologías por coma y procesar cada una
          const techs = proyecto.tecnologias
            .split(',')
            .map(tech => tech.trim())
            .filter(tech => tech.length > 0);
          
          techs.forEach(tech => {
            // Incrementar el contador para esta tecnología
            if (tecnologiasCount[tech]) {
              tecnologiasCount[tech]++;
            } else {
              tecnologiasCount[tech] = 1;
            }
          });
        }
      }
    });
  });

  // Convertir el objeto a un array ordenado por frecuencia (de mayor a menor)
  return Object.entries(tecnologiasCount)
    .map(([tecnologia, cantidad]) => ({ tecnologia, cantidad }))
    .sort((a, b) => b.cantidad - a.cantidad);
}

function obtenerTecnologiasEstudiante(data) {
  const tecnologiasSet = new Set();

  data.Integrante_Equipos.forEach(integrante => {
    integrante.equipo.Historial_Proyectos.forEach(historial => {
      if (historial.proyecto?.tecnologias) {
        const techs = historial.proyecto.tecnologias
          .split(',')
          .map(tech => tech.trim());

        techs.forEach(tech => tecnologiasSet.add(tech));
      }
    });
  });

  return Array.from(tecnologiasSet);
}

function obtenerLineasEstudiante(data) {
  const lineasSet = new Set();

  data.Integrante_Equipos.forEach(integrante => {
    integrante.equipo.Historial_Proyectos.forEach(historial => {
      if (historial.proyecto?.linea_investigacion) {
        // Dividir las tecnologías por coma y limpiar espacios
        const techs = historial.proyecto.linea_investigacion
          .split(',')
          .map(tech => tech.trim());

        // Agregar cada tecnología al Set
        techs.forEach(tech => lineasSet.add(tech));
      }
    });
  });

  return Array.from(lineasSet);
}

function obtenerProyectosPorPeriodo(data) {
  const periodos = {};
  const proyectosVistos = new Set();

  data.Integrante_Equipos?.forEach(integrante => {
    const equipo = integrante.equipo;

    if (!equipo) return;

    const clavePeriodo = `${equipo.anio}-${equipo.periodo}`;

    // Inicializar el periodo si no existe
    if (!periodos[clavePeriodo]) {
      periodos[clavePeriodo] = {
        anio: equipo.anio,
        periodo: equipo.periodo,
        proyectos: []
      };
    }

    // Recorrer los proyectos del equipo
    equipo.Historial_Proyectos?.forEach(historial => {
      const proyecto = historial.proyecto;

      if (proyecto) {
        // Crear una clave única para evitar duplicados en el mismo periodo
        const claveProyecto = `${clavePeriodo}-${proyecto.id_proyecto}`;

        if (!proyectosVistos.has(claveProyecto)) {
          proyectosVistos.add(claveProyecto);

          periodos[clavePeriodo].proyectos.push({
            id_proyecto: proyecto.id_proyecto,
            titulo: proyecto.Idea?.titulo || "Sin título",
            objetivo_general: proyecto.Idea?.objetivo_general || "Sin objetivo general",
          });
        }
      }
    });
  });

  // Convertir el objeto a array y ordenar por año y periodo
  return Object.values(periodos).sort((a, b) => {
    if (a.anio !== b.anio) return b.anio - a.anio;
    return b.periodo.localeCompare(a.periodo);
  });
}

async function generarResumenPreferenciasEstudiante(infoBasica) {
  try {
    const groq = new Groq({
      apiKey: process.env.GROQ_API_KEY
    });

    const tecnologias = obtenerTecnologiasEstudiante(infoBasica);
    const lineas = obtenerLineasEstudiante(infoBasica);
    const proyectosPorPeriodo = obtenerProyectosPorPeriodo(infoBasica);
    const vecesLider = infoBasica.Integrante_Equipos.filter(eq => eq.es_lider).length;
    const vecesIntegrante = infoBasica.Integrante_Equipos.filter(eq => !eq.es_lider).length;

    const prompt = `Eres un analista académico. Genera un resumen profesional y conciso sobre las preferencias académicas del estudiante basándote en la siguiente información:

Estudiante: ${infoBasica.nombre}
Tecnologías: ${tecnologias.join(', ')}
Líneas de investigación: ${lineas.join(', ')}
Rol como líder: ${vecesLider} veces
Rol como integrante: ${vecesIntegrante} veces

Proyectos desarrollados:
${proyectosPorPeriodo.map(p =>
      `${p.proyectos.map(proj => `- ${proj.titulo} (${proj.linea_investigacion})`).join('\n')}`
    ).join('\n')}

Genera ÚNICAMENTE un resumen de máximo 2 párrafos que describa:
1. Las tecnologías utilizadas y el enfoque técnico del estudiante
2. Las áreas de interés y la distribución de roles (líder/integrante)

IMPORTANTE: 
- No menciones falta de información ni sugieras que se necesita más data
- No uses el nombre del estudiante, solo "El estudiante"
- Sé directo y profesional
- Máximo 2 párrafos`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "llama-3.3-70b-versatile",
      temperature: 0.5, // Reducido para respuestas más consistentes
      max_tokens: 500, // Reducido para resúmenes más cortos
    });

    return chatCompletion.choices[0].message.content;

  } catch (error) {
    console.error("Error al generar resumen con Groq:", error);
    return generarResumenSimple(infoBasica);
  }
}

// Función de respaldo sin IA (por si falla la API)
function generarResumenSimple(infoBasica) {
  const tecnologias = obtenerTecnologiasEstudiante(infoBasica);
  const lineas = obtenerLineasEstudiante(infoBasica);
  const proyectosPorPeriodo = obtenerProyectosPorPeriodo(infoBasica);
  const vecesLider = infoBasica.Integrante_Equipos.filter(eq => eq.es_lider).length;
  const vecesIntegrante = infoBasica.Integrante_Equipos.filter(eq => !eq.es_lider).length;

  const tecsPrincipales = tecnologias.slice(0, 5).join(', ');
  const lineasTexto = lineas.length > 1
    ? lineas.slice(0, -1).join(', ') + ' y ' + lineas[lineas.length - 1]
    : lineas[0];

  let roleInfo = '';
  if (vecesLider > vecesIntegrante) {
    roleInfo = `principalmente como líder (${vecesLider} veces)`;
  } else if (vecesIntegrante > vecesLider) {
    roleInfo = `principalmente como integrante (${vecesIntegrante} veces)`;
  } else {
    roleInfo = `manteniendo equilibrio entre líder e integrante (${vecesLider} veces cada uno)`;
  }

  const periodoTexto = proyectosPorPeriodo.length > 1
    ? 'proyectos académicos a lo largo de varios semestres'
    : 'proyectos académicos';

  return `El estudiante ha desarrollado ${periodoTexto}, mostrando una mayor frecuencia de uso de tecnologías como ${tecsPrincipales}. A partir del registro histórico, se observa una preferencia por proyectos orientados a ${lineasTexto}.

En cuanto a los roles desempeñados, el estudiante ha participado ${roleInfo}. Esta información permite identificar cómo ha evolucionado su participación de acuerdo con cada semestre.`;
}


async function probarInformacionPerfil() {
  try {
    const codigo = "1552220"; 
    //const resultado = await listarEstudiantes();
    const resultado = await listarEstudiantes()
    console.log(resultado);
  } catch (error) {
    console.error("Error:", error);
  }
}

//probarInformacionPerfil();

async function generarPDFPerfilUsuario(codigo, res) {
  try {
    // Obtener datos del estudiante
    const datosEstudiante = await informacionPerfilUsuario(codigo);
    
    // Crear documento PDF
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    
    // Configurar headers para descarga
    const nombreArchivo = `perfil_${codigo}_${Date.now()}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${nombreArchivo}"`);
    
    // Pipe el PDF directamente al response
    doc.pipe(res);

    // ===== ENCABEZADO =====
    doc.fontSize(20)
       .fillColor('#2c3e50')
       .text(datosEstudiante.nombre.toUpperCase(), 50, 50);
    
    doc.fontSize(12)
       .fillColor('#7f8c8d')
       .text(datosEstudiante.correo, 50, 80);

    // Información básica
    doc.fontSize(10)
       .fillColor('#34495e')
       .text(`Código: ${datosEstudiante.codigo}`, 50, 110)
       .text(`Documento: ${datosEstudiante.documento}`, 250, 110);

    // Métricas principales
    doc.fontSize(11)
       .fillColor('#2c3e50')
       .text('TOTAL DE PROYECTOS REALIZADOS', 50, 140)
       .fontSize(16)
       .fillColor('#3498db')
       .text(datosEstudiante.cantidadProyectos.toString(), 50, 160);

    doc.fontSize(11)
       .fillColor('#2c3e50')
       .text('Número de veces siendo líder', 320, 140)
       .fontSize(16)
       .fillColor('#3498db')
       .text(datosEstudiante.cantidadVecesLider.toString(), 320, 160);

    // Línea divisoria
    doc.moveTo(50, 200)
       .lineTo(545, 200)
       .strokeColor('#bdc3c7')
       .lineWidth(1)
       .stroke();

    // ===== TECNOLOGÍAS USADAS =====
    let yPos = 220;
    doc.fontSize(14)
       .fillColor('#2c3e50')
       .text('Tecnologías usadas', 50, yPos);

    yPos += 25;
    const maxBarWidth = 120;
    const maxCantidad = Math.max(...datosEstudiante.tecnologias.map(t => t.cantidad), 1);

    datosEstudiante.tecnologias.slice(0, 6).forEach((tech) => {
      const barWidth = (tech.cantidad / maxCantidad) * maxBarWidth;
      
      // Nombre de la tecnología
      doc.fontSize(10)
         .fillColor('#34495e')
         .text(tech.tecnologia, 50, yPos + 2);

      // Barra de progreso (fondo)
      doc.rect(180, yPos, maxBarWidth, 12)
         .fillColor('#ecf0f1')
         .fill();

      // Barra de progreso (valor)
      doc.rect(180, yPos, barWidth, 12)
         .fillColor('#3498db')
         .fill();

      // Cantidad
      doc.fillColor('#7f8c8d')
         .fontSize(9)
         .text(tech.cantidad.toString(), 310, yPos + 2);

      yPos += 20;
    });

    // ===== LÍNEAS DE INVESTIGACIÓN =====
    yPos += 15;
    doc.fontSize(14)
       .fillColor('#2c3e50')
       .text('Líneas de investigación', 50, yPos);

    yPos += 20;
    const colores = ['#3498db', '#e74c3c', '#9b59b6', '#f39c12', '#1abc9c', '#e67e22'];
    const xInicio = 50;
    
    datosEstudiante.lineasInvestigacion.forEach((linea, index) => {
      const xPos = xInicio + (index % 3) * 165; // 3 columnas
      const yPosLinea = yPos + Math.floor(index / 3) * 35;
      
      // Fondo del badge
      doc.roundedRect(xPos, yPosLinea, 150, 25, 5)
         .fillColor(colores[index % colores.length])
         .fill();
      
      // Texto del badge
      doc.fontSize(9)
         .fillColor('#ffffff')
         .text(linea, xPos + 5, yPosLinea + 8, { 
           width: 140, 
           align: 'center' 
         });
    });

    // Calcular nuevo yPos después de las líneas
    const filasLineas = Math.ceil(datosEstudiante.lineasInvestigacion.length / 3);
    yPos += (filasLineas * 35) + 20;

    // ===== PROYECTOS POR SEMESTRE =====
    // Verificar si hay espacio, si no, nueva página
    if (yPos > 650) {
      doc.addPage();
      yPos = 50;
    }

    doc.fontSize(14)
       .fillColor('#2c3e50')
       .text('Proyectos por semestre', 50, yPos);

    yPos += 20;
    
    datosEstudiante.proyectosPeriodo.forEach((periodo) => {
      // Verificar espacio para nuevo periodo
      if (yPos > 700) {
        doc.addPage();
        yPos = 50;
      }

      doc.fontSize(11)
         .fillColor('#7f8c8d')
         .text(`${periodo.anio}-${periodo.periodo}`, 50, yPos);

      yPos += 18;
      
      periodo.proyectos.forEach((proyecto) => {
        // Verificar espacio
        if (yPos > 720) {
          doc.addPage();
          yPos = 50;
        }

        // Fondo del proyecto
        doc.rect(70, yPos - 2, 470, 20)
           .fillColor('#f8f9fa')
           .fill();

        doc.fontSize(9)
           .fillColor('#34495e')
           .text(`• ${proyecto.titulo}`, 75, yPos + 3, { 
             width: 460,
             ellipsis: true 
           });
        
        yPos += 22;
      });

      yPos += 8;
    });

    // ===== RESUMEN =====
    // Verificar espacio
    if (yPos > 600) {
      doc.addPage();
      yPos = 50;
    }

    yPos += 10;
    doc.fontSize(14)
       .fillColor('#2c3e50')
       .text('Resumen', 50, yPos);

    yPos += 20;
    
    // Caja de resumen
    const resumenHeight = 150;
    doc.rect(50, yPos, 495, resumenHeight)
       .fillColor('#f8f9fa')
       .fill();

    doc.fontSize(9)
       .fillColor('#34495e')
       .text(datosEstudiante.resumenPerfil, 60, yPos + 10, { 
         width: 475, 
         align: 'justify',
         lineGap: 3,
         height: resumenHeight - 20
       });

    // Finalizar documento
    doc.end();

    return true;
  } catch (error) {
    throw error;
  }
}

export default { buscarEstudiantePorCodigo, listarEstudiantes, listarDocentes, obtenerFotoPerfil, cargarDocentesMasivamente, informacionPerfilUsuario, generarPDFPerfilUsuario };