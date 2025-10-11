import GrupoUsuario from '../models/GrupoUsuario.js';
import Grupo from '../models/Grupo.js';
import Usuario from '../models/Usuario.js';
import UsuarioService from "../services/UsuarioService.js";

async function usuarioYaEnGrupo(codigo_usuario, codigo_materia, nombre_grupo, periodo, anio) {
    const existe = await GrupoUsuario.findOne({
        where: { 
            codigo_usuario, 
            codigo_materia, 
            nombre: nombre_grupo, 
            periodo, 
            anio 
        },
        attributes: ['id_grupo_usuario']
    });
    return !!existe;
}

async function unirseAGrupoPorIdYClave(codigo_usuario, codigo_materia, nombre_grupo, periodo, anio, clave_acceso) {
    if (!codigo_usuario || !codigo_materia || !nombre_grupo || !periodo || !anio || !clave_acceso) {
        throw new Error("Datos incompletos");
    }

    // Verificar que el periodo sea válido
    if (periodo !== "01" && periodo !== "02") {
        throw new Error("Periodo inválido, solo '01' o '02' son aceptados");
    }

    // Verificar que el año sea un número válido
    if (isNaN(anio) || anio < 2000 || anio > new Date().getFullYear() + 1) {
        throw new Error("Año inválido");
    }

    // Verificar que el usuario sea estudiante (id_rol === 3)
    const usuario = await Usuario.findByPk(codigo_usuario);
    if (!usuario || usuario.id_rol !== 3) {
        throw new Error("Solo los estudiantes pueden unirse a grupos");
    }

    // Buscar grupo por claves compuestas
    const grupo = await Grupo.findOne({ 
        where: { codigo_materia, nombre: nombre_grupo, periodo, anio }
    });
    if (!grupo) {
        throw new Error("Grupo no encontrado");
    }

    // Verifica si el grupo está habilitado
    if (!grupo.estado) {
        throw new Error("El grupo no está habilitado");
    }

    // Comparar la clave de acceso
    if (grupo.clave_acceso !== clave_acceso) {
        throw new Error("Clave de acceso incorrecta");
    }

    // Verificar si el usuario ya está en el grupo usando la función aparte
    if (await usuarioYaEnGrupo(codigo_usuario, codigo_materia, nombre_grupo, periodo, anio)) {
        throw new Error("El usuario ya pertenece a este grupo");
    }

    // Registrar al usuario en el grupo
    try {
        const nuevoGrupoUsuario = await GrupoUsuario.create({
            codigo_usuario,
            codigo_materia,
            nombre: nombre_grupo,
            periodo,
            anio,
            fecha_ingreso: new Date()
        });
        return nuevoGrupoUsuario;
    } catch (error) {
        throw new Error("Error al registrar al usuario en el grupo: " + error.message);
    }
}

async function listarParticipantesGrupo(codigo_materia, nombre_grupo, periodo, anio ) {
    try {
        // Buscar todos los usuarios del grupo
        const participantes = await GrupoUsuario.findAll({
            where: { 
                codigo_materia, 
                nombre: nombre_grupo, 
                periodo, 
                anio 
            },
            include: [{
                model: Usuario,
                attributes: ['codigo', 'nombre', 'uid_firebase']
            }],
            attributes: ['id_grupo_usuario']
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