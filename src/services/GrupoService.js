import Grupo from '../models/Grupo.js';
import GrupoUsuario from '../models/GrupoUsuario.js';
import crypto from "crypto";
import QRCode from 'qrcode';

async function crearGrupo(nombre, clave_acceso, semestre, id_materia, id_docente) {
    if (!nombre || !semestre || !id_materia || !id_docente) {
        throw new Error("Datos incompletos");
    }

    try {
        const nuevoGrupo = await Grupo.create({
            nombre: nombre,
            clave_acceso: clave_acceso,
            estado: true,
            semestre: semestre,
            id_materia: id_materia
        });

        const nuevoGrupoUsuario = await GrupoUsuario.create({
            fecha_ingreso: new Date(),
            id_usuario: id_docente,
            id_grupo: nuevoGrupo.id_grupo
        });

        return nuevoGrupo;
    } catch (error) {
        throw new Error("Error al crear el grupo: " + error.message);
    }

}

async function deshabilitarGrupo(id_grupo) {
    if (!id_grupo) {
        throw new Error("ID de grupo es requerido");
    }
    try {
        const grupo = await Grupo.findByPk(id_grupo);
        if (!grupo) {
            throw new Error("Grupo no encontrado");
        }
        grupo.estado = false;
        await grupo.save();
        return grupo;
    } catch (error) {
        throw new Error("Error al deshabilitar el grupo: " + error.message);
    }

}


function generarClaveAcceso() {
    return crypto.randomBytes(Math.ceil(4))
        .toString("hex")
        .slice(0, 8)
        .toUpperCase();
}



async function generarCodigoQR(id_grupo) {
    if (!id_grupo) {
        throw new Error("ID de grupo es requerido");
    }
    try {
        const grupo = await Grupo.findByPk(id_grupo);
        if (!grupo) {
            throw new Error("Grupo no encontrado");
        }

        const url = `${process.env.BASE_URL_FRONTEND}/student/group/${grupo.id_grupo}?clave=${grupo.clave_acceso}`;
        const qr = await QRCode.toDataURL(url);
        return { id_grupo, qr };
    } catch (error) {
        throw new Error("Error al generar el codigo QR: " + error.message);
    }
}

export default { crearGrupo, deshabilitarGrupo, generarClaveAcceso, generarCodigoQR };