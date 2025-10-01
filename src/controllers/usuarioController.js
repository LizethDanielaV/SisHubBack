import Rol from "../models/Rol.js";
import Usuario from "../models/Usuario.js";
import admin from "../firebaseAdmin.js";

export const registrarUsuario = async (req, res) => {
  try {
    const uid = req.userFirebase.uid;
    const userRecord = await admin.auth().getUser(uid);

    const { documento, telefono, codigo, rol, nombre } = req.body;

    const rolDb = await Rol.findOne({ where: { descripcion: rol } });
    if (!rolDb) return res.status(400).json({ error: "Rol no válido" });

    let usuario = await Usuario.findOne({ where: { uid_firebase: uid } });
    if (!usuario) {
      usuario = await Usuario.create({
        nombre: userRecord.displayName || nombre,
        documento,
        correo: userRecord.email,
        telefono,
        uid_firebase: uid,
        id_rol: rolDb.id_rol,
        id_estado: 1
      });
    } else {
      await usuario.update({
        nombre: userRecord.displayName || nombre,
        documento,
        telefono,
        id_rol: rolDb.id_rol
      });
    }

    await admin.auth().setCustomUserClaims(uid, { 
      role: rolDb.descripcion, 
      id_rol: rolDb.id_rol 
    });

    return res.json({ ok: true, usuario });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Error al registrar usuario" });
  }
};