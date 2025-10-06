import GrupoUsuario from '../models/GrupoUsuario.js';
import Grupo from '../models/Grupo.js';
import Usuario from '../models/Usuario.js';
import UsuarioService from "../services/UsuarioService.js";

async function usuarioYaEnGrupo(id_usuario, id_grupo) {
    const existe = await GrupoUsuario.findOne({
        where: { id_usuario, id_grupo }
    });
    return !!existe;
}

async function unirseAGrupoPorIdYClave(id_usuario, id_grupo, clave_acceso) {
    if (!id_usuario || !id_grupo || !clave_acceso) {
        throw new Error("Datos incompletos");
    }

    // Verificar que el usuario sea estudiante (id_rol === 3)
    const usuario = await Usuario.findByPk(id_usuario);
    if (!usuario || usuario.id_rol !== 3) {
        throw new Error("Solo los estudiantes pueden unirse a grupos");
    }

    // Buscar grupo por id y verificar que esté habilitado
    const grupo = await Grupo.findOne({ where: { id_grupo, estado: true } });
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

async function listarParticipantesGrupo(id_grupo) {
    try {
        // Buscar todos los usuarios del grupo
        const participantes = await GrupoUsuario.findAll({
            where: { id_grupo },
            include: [{
                model: Usuario,
                attributes: ['id_usuario', 'nombre', 'uid_firebase', 'codigo']
            }]
        });

        // Obtener la foto de cada usuario usando UsuarioService.obtenerFotoPerfil
        const resultado = await Promise.all(participantes.map(async (p) => {
            let fotoObj;
            try {
                fotoObj = await UsuarioService.obtenerFotoPerfil(p.Usuario.uid_firebase);
            } catch (error) {
                fotoObj = { photoURL: null };
            }
            return {
                codigo: p.Usuario.codigo,
                nombre: p.Usuario.nombre,
                foto: fotoObj.photoURL || null
            };
        }));

        return resultado;
    } catch (error) {
        throw new Error("Error al listar participantes: " + error.message);
    }
}

export default { unirseAGrupoPorIdYClave, listarParticipantesGrupo };