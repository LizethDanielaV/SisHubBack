import Usuario from '../models/Usuario.js';
import admin from "../firebaseAdmin.js";
import { Op } from 'sequelize';
import Rol from '../models/Rol.js';
import Estado from '../models/Estado.js';


async function cargarDocentesMasivamente(docentes) {
  const resultados = {
    exitosos: [],
    errores: []
  };

  // Obtener rol y estado una sola vez
  const rolDocente = await Rol.findOne({
    where: { descripcion: "DOCENTE" }
  });

  const estadoHabilitado = await Estado.findOne({
    where: { descripcion: "HABILITADO" }
  });

  if (!rolDocente || !estadoHabilitado) {
    throw new Error("Configuración incompleta: Rol DOCENTE o Estado HABILITADO no encontrado");
  }

  for (const docente of docentes) {
    let userRecord = null;

    try {
      // 1. Verificar si ya existe en la BD
      const usuarioExistente = await Usuario.findOne({
        where: {
          [Op.or]: [
            { codigo: docente.codigo },
            { documento: docente.documento },
            { correo: docente.correo }
          ]
        }
      });

      if (usuarioExistente) {
        resultados.errores.push({
          docente,
          error: `Ya existe un usuario con el código, documento o correo`
        });
        continue;
      }

      // 2. Crear usuario en Firebase
      try {
        userRecord = await admin.auth().createUser({
          email: docente.correo,
          emailVerified: true, // Los admin lo cargan ya verificado
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
              continue;
            }
          } catch (getUserError) {
            resultados.errores.push({
              docente,
              error: `Error al verificar correo en Firebase: ${getUserError.message}`
            });
            continue;
          }
        } else {
          resultados.errores.push({
            docente,
            error: `Error en Firebase: ${firebaseError.message}`
          });
          continue;
        }
      }

      // 3. Crear usuario en la BD
      const nuevoUsuario = await Usuario.create({
        codigo: docente.codigo,
        nombre: docente.nombre,
        documento: docente.documento,
        correo: docente.correo,
        telefono: docente.telefono || null,
        uid_firebase: userRecord.uid,
        id_rol: rolDocente.id_rol,
        id_estado: estadoHabilitado.id_estado // HABILITADO directo
      });

      // 4. Establecer custom claims en Firebase
      await admin.auth().setCustomUserClaims(userRecord.uid, {
        role: "DOCENTE",
        id_rol: rolDocente.id_rol,
        estado: "HABILITADO"
      });

      // 5. Enviar enlace para establecer contraseña (opcional)
      // await admin.auth().generatePasswordResetLink(docente.correo);
      // Aquí podrías enviar un email con el link

      resultados.exitosos.push({
        codigo: nuevoUsuario.codigo,
        nombre: nuevoUsuario.nombre,
        correo: nuevoUsuario.correo,
        uid: userRecord.uid
      });

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
    }
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