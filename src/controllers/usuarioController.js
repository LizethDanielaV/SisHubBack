import Rol from "../models/Rol.js";
import Usuario from "../models/Usuario.js";
import admin from "../firebaseAdmin.js";
import Estado from "../models/Estado.js";
import UsuarioService from "../services/UsuarioService.js";

export const registrarUsuario = async (req, res) => {
  try {
    const uid = req.userFirebase.uid;
    const userRecord = await admin.auth().getUser(uid);

    const { documento, telefono, codigo, rol } = req.body;

    const rolDb = await Rol.findOne({ where: { descripcion: rol } });
    if (!rolDb) return res.status(400).json({ error: "Rol no válido" });

    let estadoInicial;
    if (rolDb.descripcion === "DOCENTE") {
      const estadoStandBy = await Estado.findOne({
        where: { descripcion: "STAND_BY" }
      });
      estadoInicial = estadoStandBy ? estadoStandBy.id_estado : 1;
    } else {
      const estadoHabilitado = await Estado.findOne({
        where: { descripcion: "HABILITADO" }
      });
      estadoInicial = estadoHabilitado ? estadoHabilitado.id_estado : 1;
    }

    let usuario = await Usuario.findOne({ where: { uid_firebase: uid } });
    if (!usuario) {
      usuario = await Usuario.create({
        nombre: userRecord.displayName || nombre,
        documento,
        correo: userRecord.email,
        telefono,
        codigo,
        uid_firebase: uid,
        id_rol: rolDb.id_rol,
        id_estado: estadoInicial
      });
    } else {
      await usuario.update({
        nombre: userRecord.displayName || nombre,
        documento,
        telefono,
        codigo,
        id_rol: rolDb.id_rol,
        id_estado: estadoInicial
      });
    }

    const estadoActual = await Estado.findByPk(estadoInicial);

    await admin.auth().setCustomUserClaims(uid, {
      role: rolDb.descripcion,
      id_rol: rolDb.id_rol,
      estado: estadoActual?.descripcion || "HABILITADO"
    });

    await usuario.reload({
      include: [
        { model: Rol, attributes: ["id_rol", "descripcion"] },
        { model: Estado, attributes: ["id_estado", "descripcion"] }
      ]
    });

    return res.json({
      ok: true,
      usuario,
      mensaje: rolDb.descripcion === "DOCENTE"
        ? "Registro exitoso. Tu cuenta está pendiente de aprobación por un administrador."
        : "Registro exitoso. Tu cuenta ha sido habilitada."
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error al registrar usuario" });
  }
};

export const obtenerUsuarioPorUid = async (req, res) => {
  try {
    const uid = req.userFirebase.uid;

    const usuario = await Usuario.findOne({
      where: { uid_firebase: uid },
      include: [
        { model: Rol, attributes: ["id_rol", "descripcion"] },
        { model: Estado, attributes: ["id_estado", "descripcion"] }
      ]
    });

    if (!usuario) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    return res.json({ ok: true, usuario });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error al obtener usuario" });
  }
};

export const obtenerTodosLosUsuarios = async (req, res) => {
  try {
    const usuarios = await Usuario.findAll({
      include: [
        {
          model: Rol,
          attributes: ["id_rol", "descripcion"],
          where: {
            descripcion: ["DOCENTE", "ESTUDIANTE"]
          }
        },
        {
          model: Estado,
          attributes: ["id_estado", "descripcion"],
          where: {
            descripcion: ["HABILITADO", "INHABILITADO"]
          }
        }
      ],
      attributes: [
        "codigo",
        "nombre",
        "documento",
        "correo",
        "telefono",
        "uid_firebase"
      ],
      order: [["codigo", "DESC"]]
    });

    return res.json({
      ok: true,
      total: usuarios.length,
      usuarios
    });
  } catch (err) {
    console.error("Error al obtener usuarios:", err);
    return res.status(500).json({ error: "Error al obtener usuarios" });
  }
};

export const obtenerUsuariosStandBy = async (req, res) => {
  try {
    const usuariosStandBy = await Usuario.findAll({
      include: [
        {
          model: Rol,
          attributes: ["id_rol", "descripcion"]
        },
        {
          model: Estado,
          attributes: ["id_estado", "descripcion"],
          where: {
            descripcion: "STAND_BY"
          }
        }
      ],
      attributes: [
        "codigo",
        "nombre",
        "documento",
        "correo",
        "telefono",
        "uid_firebase"
      ],
      order: [["codigo", "DESC"]]
    });

    return res.json({
      ok: true,
      total: usuariosStandBy.length,
      usuarios: usuariosStandBy
    });
  } catch (err) {
    console.error("Error al obtener usuarios en STAND_BY:", err);
    return res.status(500).json({ error: "Error al obtener usuarios en espera" });
  }
};

export const cambiarEstadoUsuario = async (req, res) => {
  try {
    const { codigo } = req.params;
    const { habilitar } = req.body;

    const usuario = await Usuario.findByPk(codigo, {
      include: [
        { model: Rol, attributes: ["descripcion"] },
        { model: Estado, attributes: ["descripcion"] }
      ]
    });

    if (!usuario) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    const nuevoEstado = await Estado.findOne({
      where: { descripcion: habilitar ? "HABILITADO" : "INHABILITADO" }
    });

    if (!nuevoEstado) {
      return res.status(400).json({ error: "Estado no válido" });
    }

    await usuario.update({ id_estado: nuevoEstado.id_estado });

    if (usuario.uid_firebase) {
      await admin.auth().setCustomUserClaims(usuario.uid_firebase, {
        role: usuario.Rol.descripcion,
        id_rol: usuario.id_rol,
        estado: nuevoEstado.descripcion
      });
    }

    await usuario.reload({
      include: [
        { model: Rol, attributes: ["id_rol", "descripcion"] },
        { model: Estado, attributes: ["id_estado", "descripcion"] }
      ]
    });

    return res.json({
      ok: true,
      mensaje: `Usuario ${habilitar ? "habilitado" : "inhabilitado"} correctamente`,
      usuario
    });
  } catch (err) {
    console.error("Error al cambiar estado del usuario:", err);
    return res.status(500).json({ error: "Error al cambiar estado del usuario" });
  }
};

export const aprobarPostulacion = async (req, res) => {
  try {
    const { codigo } = req.params;

    const usuario = await Usuario.findByPk(codigo, {
      include: [
        { model: Rol, attributes: ["descripcion"] },
        { model: Estado, attributes: ["descripcion"] }
      ]
    });

    if (!usuario) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    if (usuario.Estado.descripcion !== "STAND_BY") {
      return res.status(400).json({
        error: "El usuario no está en estado de espera"
      });
    }

    const rolDocente = await Rol.findOne({
      where: { descripcion: "DOCENTE" }
    });

    if (!rolDocente) {
      return res.status(400).json({ error: "Rol DOCENTE no encontrado" });
    }

    const estadoHabilitado = await Estado.findOne({
      where: { descripcion: "HABILITADO" }
    });

    if (!estadoHabilitado) {
      return res.status(400).json({ error: "Estado HABILITADO no encontrado" });
    }

    await usuario.update({
      id_rol: rolDocente.id_rol,
      id_estado: estadoHabilitado.id_estado
    });

    if (usuario.uid_firebase) {
      await admin.auth().setCustomUserClaims(usuario.uid_firebase, {
        role: "DOCENTE",
        id_rol: rolDocente.id_rol,
        estado: "HABILITADO"
      });
    }

    await usuario.reload({
      include: [
        { model: Rol, attributes: ["id_rol", "descripcion"] },
        { model: Estado, attributes: ["id_estado", "descripcion"] }
      ]
    });

    return res.json({
      ok: true,
      mensaje: "Postulación aprobada correctamente. Usuario ahora es DOCENTE",
      usuario
    });
  } catch (err) {
    console.error("Error al aprobar postulación:", err);
    return res.status(500).json({ error: "Error al aprobar postulación" });
  }
};

export const rechazarPostulacion = async (req, res) => {
  try {
    const { codigo } = req.params;

    const usuario = await Usuario.findByPk(codigo, {
      include: [
        { model: Estado, attributes: ["descripcion"] }
      ]
    });

    if (!usuario) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    if (usuario.Estado.descripcion !== "STAND_BY") {
      return res.status(400).json({
        error: "El usuario no está en estado de espera"
      });
    }

    const estadoRechazado = await Estado.findOne({
      where: { descripcion: "RECHAZADO" }
    });

    if (estadoRechazado) {
      await usuario.update({ id_estado: estadoRechazado.id_estado });

      if (usuario.uid_firebase) {
        await admin.auth().setCustomUserClaims(usuario.uid_firebase, {
          role: usuario.Rol?.descripcion,
          id_rol: usuario.id_rol,
          estado: "RECHAZADO"
        });
      }

      return res.json({
        ok: true,
        mensaje: "Postulación rechazada correctamente",
        usuario
      });
    } else {
      await usuario.destroy();

      return res.json({
        ok: true,
        mensaje: "Postulación rechazada. Usuario eliminado del sistema"
      });
    }
  } catch (err) {
    console.error("Error al rechazar postulación:", err);
    return res.status(500).json({ error: "Error al rechazar postulación" });
  }
};


export const listarDocentes = async (req, res) => {
  try {
    const docentes = await UsuarioService.listarDocentes();
    return res.json({ docentes });
  } catch (error) {
    console.error("Error al listar docentes:", error);
    return res.status(500).json({ error: "Error al listar docentes" });
  }
};