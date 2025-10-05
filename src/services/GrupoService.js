import Grupo from '../models/Grupo.js';
import GrupoUsuario from '../models/GrupoUsuario.js';
import crypto from "crypto" ;

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

export default { crearGrupo, deshabilitarGrupo, generarClaveAcceso };