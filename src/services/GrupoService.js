import Grupo from '../models/Grupo.js';
import GrupoUsuario from '../models/GrupoUsuario.js';
import crypto from "crypto";
import QRCode from 'qrcode';
import { Sequelize } from "sequelize";
import Usuario from '../models/Usuario.js';
import Rol from '../models/Rol.js';

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


async function listarGruposPorMateria(id_materia) {
    if (!id_materia) {
        throw new Error("El ID de la materia es obligatorio");
    }

    try {
        const grupos = await Grupo.findAll({
            where: { id_materia },
            attributes: [
                "id_grupo",
                "nombre",
                "clave_acceso",
                "estado",
                [
                    Sequelize.literal(`(
                SELECT COUNT(*) 
                FROM grupo_usuario gu 
                WHERE gu.id_grupo = Grupo.id_grupo
                )`),
                "participantes"
                ]
            ],
            include: [
                {
                    model: GrupoUsuario,
                    attributes: [],
                    include: [
                        {
                            model: Usuario,
                            attributes: ["id_usuario", "nombre", "id_rol"],
                            include: [{
                                model: Rol,
                                attributes: ["descripcion"]
                            }
                            ]
                        }
                    ]
                }
            ],
            raw: true,
            nest: true
        });


        const resultado = grupos.map(grupo => {
            let docente = "No asignado";
            if (grupo["grupo_usuarios.Usuario.id_rol"] === 2) {
                docente = grupo["grupo_usuarios.Usuario.nombre"];
            }

            return {
                id_grupo: grupo.id_grupo,
                nombre: grupo.nombre,
                clave_acceso: grupo.clave_acceso,
                estado: grupo.estado ? "Habilitado" : "Deshabilitado",
                participantes: grupo.participantes,
                docente: docente
            };
        });
        return resultado;
    } catch (error) {
        throw new Error("Error al listar grupos: " + error.message);
    }
}


export default { crearGrupo, deshabilitarGrupo, generarClaveAcceso, generarCodigoQR, listarGruposPorMateria };