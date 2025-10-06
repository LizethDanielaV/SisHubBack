import Usuario from '../models/Usuario.js';
import admin from "../firebaseAdmin.js";


async function listarDocentes() {
    try {
        const docentes = await Usuario.findAll({
            where: { id_rol: '2' },
            attributes: ['id_usuario', 'nombre', 'correo']
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

export default { listarDocentes, obtenerFotoPerfil };