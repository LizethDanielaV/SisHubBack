import Usuario from '../models/Usuario.js';
import admin from "../firebaseAdmin.js";
import { Op } from 'sequelize';
import Rol from '../models/Rol.js';
import Estado from '../models/Estado.js';
import { progressService } from "../services/progressService.js";


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
        const docentes = await Usuario.findAll({
            where: { id_rol: '3' },
            attributes: ['codigo', 'nombre', 'correo']
        });
        return docentes;
    } catch (error) {
        throw new Error("Error al listar docentes: " + error.message);
    }
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

export default { buscarEstudiantePorCodigo, listarEstudiantes, listarDocentes, obtenerFotoPerfil, cargarDocentesMasivamente };