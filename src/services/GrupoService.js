import Grupo from '../models/Grupo.js';
import GrupoUsuario from '../models/GrupoUsuario.js';
import crypto from "crypto";
import QRCode from 'qrcode';
import { Sequelize } from "sequelize";
import Materia from '../models/Materia.js';
import Area from '../models/Area.js';

async function crearGrupo(nombre, clave_acceso, id_materia, id_docente) {
    if (!nombre || !id_materia || !id_docente) {
        throw new Error("Datos incompletos");
    }

    try {
        const nuevoGrupo = await Grupo.create({
            nombre: nombre,
            clave_acceso: clave_acceso,
            estado: true,
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

async function actualizarEstado(id_grupo, nuevoEstado) {
    if (!id_grupo) {
        throw new Error("ID de grupo es requerido");
    }
    try {
        const grupo = await Grupo.findByPk(id_grupo);
        if (!grupo) {
            throw new Error("Grupo no encontrado");
        }
        grupo.estado = nuevoEstado;
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

async function obtenerClaveYCodigoQR(id_grupo) {
    if (!id_grupo) {
        throw new Error("ID de grupo es requerido");
    }
    try {
        const grupo = await Grupo.findByPk(id_grupo);
        if (!grupo) {
            throw new Error("Grupo no encontrado");
        }

        // Reutiliza el método para generar el QR
        const { qr } = await generarCodigoQR(id_grupo);

        return {
            clave_acceso: grupo.clave_acceso,
            qr
        };
    } catch (error) {
        throw new Error("Error al obtener la clave y el código QR: " + error.message);
    }
}

async function listarGruposPorMateria(id_materia) {
    if (!id_materia) {
        throw new Error("El ID de la materia es obligatorio");
    }

    try {
        const grupos = await Grupo.findAll({
            where: { id_materia },
            distinct: true,
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
                ],
                [
                    Sequelize.literal(`(
                        SELECT u.nombre 
                        FROM grupo_usuario gu
                        JOIN Usuario u ON gu.id_usuario = u.id_usuario
                        WHERE gu.id_grupo = Grupo.id_grupo 
                        AND u.id_rol = 2
                        LIMIT 1
                    )`),
                    "docente"
                ]

            ],
            raw: true
        });


        return grupos.map(grupo => ({
            id_grupo: grupo.id_grupo,
            nombre: grupo.nombre,
            clave_acceso: grupo.clave_acceso,
            estado: grupo.estado ? "Habilitado" : "Deshabilitado",
            participantes: grupo.participantes,
            docente: grupo.docente || "No asignado"
        }));

    } catch (error) {
        throw new Error("Error al listar grupos: " + error.message);
    }
}


async function listarGruposHabilitadosPorMateria(id_materia) {
    if (!id_materia) {
        throw new Error("El ID de la materia es obligatorio");
    }

    try {
        const grupos = await Grupo.findAll({
            where: {
                id_materia,
                estado: true
            },
            attributes: [
                "id_grupo",
                "nombre",
                "clave_acceso",
                [
                    Sequelize.literal(`(
                        SELECT COUNT(*) 
                        FROM grupo_usuario gu 
                        WHERE gu.id_grupo = Grupo.id_grupo
                    )`),
                    "participantes"
                ],
                [
                    Sequelize.literal(`(
                        SELECT u.nombre 
                        FROM grupo_usuario gu
                        JOIN Usuario u ON gu.id_usuario = u.id_usuario
                        WHERE gu.id_grupo = Grupo.id_grupo 
                        AND u.id_rol = 2
                        LIMIT 1
                    )`),
                    "docente"
                ]
            ],
            raw: true
        });


        return grupos.map(grupo => ({
            id_grupo: grupo.id_grupo,
            nombre: grupo.nombre,
            clave_acceso: grupo.clave_acceso,
            participantes: grupo.participantes,
            docente: grupo.docente || "No asignado"
        }));

    } catch (error) {
        throw new Error("Error al listar grupos habilitados: " + error.message);
    }
}



async function listarGruposPorUsuario(id_usuario) {
    if (!id_usuario) {
        throw new Error("El ID del docente es obligatorio");
    }

    try {
        const grupos = await Grupo.findAll({
            include: [
                {
                    model: GrupoUsuario,
                    required: true,
                    where: { id_usuario }
                },
                {
                    model: Materia,
                    attributes: ['nombre', "codigo", "creditos", "prerrequisitos", "tipo"],
                    include: [
                        {
                            model: Area,
                            attributes: ['nombre'],
                        }
                    ]
                }
            ],
            raw: true,
            nest: true

        });

        return grupos.map(g => ({
            id_grupo: g.id_grupo,
            nombre_grupo: g.nombre,
            codigo_materia: g.Materium?.codigo,
            nombre_materia: g.Materium.nombre,
            creditos: g.Materium.creditos,
            prerrequisitos: g.Materium.prerrequisitos || "Ninguno",
            area_conocimiento: g.Materium.Area?.nombre || "No especificada",
            estado: g.estado ? "Habilitado" : "Deshabilitado"
        }));
    } catch (error) {
        throw new Error("Error al listar los grupos del docente: " + error.message);
    }

}

async function listarTodosLosGrupos() {
    try {
        const grupos = await Grupo.findAll({
            include: [
                {
                    model: Materia,
                    attributes: ['codigo', 'creditos', 'prerrequisitos'],
                    include: [
                        {
                            model: Area,
                            attributes: ['nombre']
                        }
                    ]
                }
            ],
            attributes: [
                'id_grupo',
                'nombre',
                'estado'
            ],
            raw: true,
            nest: true
        });

        return grupos.map(g => ({
            id_grupo: g.id_grupo,
            nombre: g.nombre,
            codigo_materia: g.Materium?.codigo,
            creditos: g.Materium?.creditos,
            prerrequisitos: g.Materium?.prerrequisitos || "Ninguno",
            area_conocimiento: g.Materium?.Area?.nombre || "No especificada",
            estado: g.estado ? 1 : 0
        }));
    } catch (error) {
        throw new Error("Error al listar todos los grupos: " + error.message);
    }
}


export default {
    crearGrupo, actualizarEstado, generarClaveAcceso, generarCodigoQR, obtenerClaveYCodigoQR, listarGruposPorMateria,
    listarGruposHabilitadosPorMateria, listarGruposPorUsuario, listarTodosLosGrupos
};