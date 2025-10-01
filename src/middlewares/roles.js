import Usuario from "../models/Usuario.js";

export const verificarRol = (rolesPermitidos) => {
  return async (req, res, next) => {
    const uid = req.userFirebase?.uid;
    if (!uid) return res.status(401).json({ error: "No autenticado" });

    const usuario = await Usuario.findOne({ where: { uid_firebase: uid } });
    if (!usuario) return res.status(404).json({ error: "Usuario no encontrado" });

    req.userDb = usuario;
    if (!rolesPermitidos.includes(usuario.id_rol)) {
      return res.status(403).json({ error: "Acceso denegado por rol" });
    }

    next();
  };
};