import Usuario from "../models/Usuario.js";
import Estado from "../models/Estado.js";
import Rol from "../models/Rol.js";

export const verificarRol = (rolesPermitidos) => {
  return async (req, res, next) => {
    const uid = req.userFirebase?.uid;
    if (!uid) return res.status(401).json({ error: "No autenticado" });

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

    if (usuario.Rol?.descripcion === "DOCENTE" && usuario.Estado?.descripcion === "STAND_BY") {
      return res.status(403).json({ 
        error: "Cuenta pendiente de aprobación",
        mensaje: "Tu cuenta está en espera de ser aprobada por un administrador. No puedes acceder a los servicios hasta que sea aprobada."
      });
    }

    if (usuario.Estado?.descripcion === "INHABILITADO") {
      return res.status(403).json({ 
        error: "Cuenta inhabilitada",
        mensaje: "Tu cuenta ha sido deshabilitada. Contacta con el administrador."
      });
    }

    req.userDb = usuario;
    if (!rolesPermitidos.includes(usuario.id_rol)) {
      return res.status(403).json({ error: "Acceso denegado por rol" });
    }

    next();
  };
};