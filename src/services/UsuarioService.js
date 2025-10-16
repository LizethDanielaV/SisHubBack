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
    let firebaseUserCreated = false; // ✅ Flag para saber si creamos el usuario

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
        continue; // ✅ Saltar al siguiente docente
      }

      // 2. Verificar si el correo ya existe en Firebase
      try {
        const existingFirebaseUser = await admin.auth().getUserByEmail(docente.correo);
        
        // Si llegamos aquí, el usuario existe en Firebase
        // Verificar si está en nuestra BD
        const usuarioConUid = await Usuario.findOne({
          where: { uid_firebase: existingFirebaseUser.uid }
        });

        if (usuarioConUid) {
          // Usuario existe en ambos sistemas
          resultados.errores.push({
            docente,
            error: `El correo ${docente.correo} ya está registrado en el sistema`
          });
        } else {
          // Usuario huérfano en Firebase (existe en Firebase pero no en BD)
          resultados.errores.push({
            docente,
            error: `El correo ${docente.correo} ya existe en Firebase pero no en la base de datos. Contacte al administrador.`
          });
        }
        continue; // ✅ Saltar al siguiente docente
        
      } catch (getUserError) {
        // Si el error es 'user-not-found', está bien, podemos crear el usuario
        if (getUserError.code !== 'auth/user-not-found') {
          // Error real de Firebase
          resultados.errores.push({
            docente,
            error: `Error al verificar correo en Firebase: ${getUserError.message}`
          });
          continue; // ✅ Saltar al siguiente docente
        }
        // Si es 'auth/user-not-found', continuamos con la creación
      }

      // 3. Crear usuario en Firebase (solo si no existe)
      try {
        userRecord = await admin.auth().createUser({
          email: docente.correo,
          emailVerified: true,
          displayName: docente.nombre,
          disabled: false
        });
        firebaseUserCreated = true; // ✅ Marcamos que creamos el usuario
      } catch (firebaseError) {
        resultados.errores.push({
          docente,
          error: `Error al crear usuario en Firebase: ${firebaseError.message}`
        });
        continue; // ✅ Saltar al siguiente docente
      }

      // 4. Crear usuario en la BD
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

      // 5. Establecer custom claims en Firebase
      await admin.auth().setCustomUserClaims(userRecord.uid, {
        role: "DOCENTE",
        id_rol: rolDocente.id_rol,
        estado: "HABILITADO"
      });

      // 6. (Opcional) Enviar enlace para establecer contraseña
      // await admin.auth().generatePasswordResetLink(docente.correo);
      // Aquí podrías enviar un email con el link

      // ✅ Éxito total
      resultados.exitosos.push({
        codigo: nuevoUsuario.codigo,
        nombre: nuevoUsuario.nombre,
        correo: nuevoUsuario.correo,
        uid: userRecord.uid
      });

    } catch (error) {
      // ✅ Si algo falla, limpiar Firebase SOLO si nosotros lo creamos
      if (firebaseUserCreated && userRecord?.uid) {
        try {
          await admin.auth().deleteUser(userRecord.uid);
          console.log(`Usuario de Firebase ${userRecord.uid} eliminado por error en BD`);
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

export default { listarDocentes, obtenerFotoPerfil, cargarDocentesMasivamente };