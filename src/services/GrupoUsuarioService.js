import GrupoUsuario from '../models/GrupoUsuario.js';
import Grupo from '../models/Grupo.js';
import Usuario from '../models/Usuario.js';

async function usuarioYaEnGrupo(id_usuario, id_grupo) {
    const existe = await GrupoUsuario.findOne({
        where: { id_usuario, id_grupo }
    });
    return !!existe;
}

async function unirseAGrupoPorNombreYClave(id_usuario, nombre_grupo, clave_acceso) {
    if (!id_usuario || !nombre_grupo || !clave_acceso) {
        throw new Error("Datos incompletos");
    }

    // Verificar que el usuario sea estudiante (id_rol === 3)
    const usuario = await Usuario.findByPk(id_usuario);
    if (!usuario || usuario.id_rol !== 3) {
        throw new Error("Solo los estudiantes pueden unirse a grupos");
    }

    // Buscar grupo por nombre y verificar que esté habilitado
    const grupo = await Grupo.findOne({ where: { nombre: nombre_grupo, estado: true } });
    if (!grupo) {
        throw new Error("Grupo no encontrado o no disponible");
    }

    // Comparar la clave de acceso
    if (grupo.clave_acceso !== clave_acceso) {
        throw new Error("Clave de acceso incorrecta");
    }

    // Verificar si el usuario ya está en el grupo usando la función aparte
    if (await usuarioYaEnGrupo(id_usuario, grupo.id_grupo)) {
        throw new Error("El usuario ya pertenece a este grupo");
    }

    // Registrar al usuario en el grupo
    try {
        const nuevoGrupoUsuario = await GrupoUsuario.create({
            fecha_ingreso: new Date(),
            id_usuario,
            id_grupo: grupo.id_grupo
        });
        return nuevoGrupoUsuario;
    } catch (error) {
        throw new Error("Error al registrar al usuario en el grupo: " + error.message);
    }
}

export default { unirseAGrupoPorNombreYClave };