import GrupoUsuario from '../models/GrupoUsuario.js';
import Grupo from '../models/Grupo.js';
import Usuario from '../models/Usuario.js';
import Rol from '../models/Rol.js';
import Estado from '../models/Estado.js';
import UsuarioService from "../services/UsuarioService.js";
import admin from "../firebaseAdmin.js";
import { Op } from 'sequelize';
import { progressService } from "../services/progressService.js";
import db from "../db/db.js";

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

async function usuarioYaEnOtroGrupo(codigo_usuario, codigo_materia, periodo, anio) {
    const existe = await GrupoUsuario.findOne({
        where: {
            codigo_usuario,
            codigo_materia,
            periodo,
            anio
        },
        attributes: ['id_grupo_usuario', 'codigo_materia', 'nombre', 'periodo', 'anio']
    });
    return !!existe;
}

async function activarEstadoEnGrupo(codigo_usuario, codigo_materia, nombre_grupo, periodo, anio, clave_acceso) {
    if (!codigo_usuario || !codigo_materia || !nombre_grupo || !periodo || !anio || !clave_acceso) {
        throw new Error("Datos incompletos");
    }

    if (periodo !== "01" && periodo !== "02") {
        throw new Error("Periodo inválido, solo '01' o '02' son aceptados");
    }

    if (isNaN(anio) || anio < 2000 || anio > new Date().getFullYear() + 1) {
        throw new Error("Año inválido");
    }

    const usuario = await Usuario.findByPk(codigo_usuario);
    if (!usuario || usuario.id_rol !== 3) {
        throw new Error("Solo los estudiantes pueden activar su participación en grupos");
    }

    const grupo = await Grupo.findOne({
        where: { codigo_materia, nombre: nombre_grupo, periodo, anio }
    });
    if (!grupo) {
        throw new Error("Grupo no encontrado");
    }

    if (!grupo.estado) {
        throw new Error("El grupo no está habilitado");
    }

    if (grupo.clave_acceso !== clave_acceso) {
        throw new Error("Clave de acceso incorrecta");
    }

    const grupoUsuario = await GrupoUsuario.findOne({
        where: {
            codigo_usuario,
            codigo_materia,
            nombre: nombre_grupo,
            periodo,
            anio
        }
    });

    if (!grupoUsuario) {
        throw new Error("El usuario no pertenece a este grupo");
    }

    if (grupoUsuario.estado === true) {
        return { mensaje: "El usuario ya tiene el estado activo en este grupo" };
    }

    grupoUsuario.estado = true;
    await grupoUsuario.save();

    return {
        mensaje: "Estado activado correctamente",
        grupo_usuario: grupoUsuario
    };
}

async function listarParticipantesGrupo(codigo_materia, nombre_grupo, periodo, anio) {
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

async function matricularEstudiantesMasivamente(matriculas, progressId = null) {
    const resultados = {
        exitosos: [],
        errores: [],
        resumen: {
            totalGrupos: matriculas.length,
            totalEstudiantes: 0,
            estudiantesMatriculados: 0,
            estudiantesConError: 0,
            usuariosCreados: 0
        }
    };

    const BATCH_SIZE = 10;
    let estudiantesProcesados = 0;

    try {
        // 1. OBTENER ROL Y ESTADO UNA SOLA VEZ
        if (progressId) {
            progressService.updateProgress(progressId, 0, 'Verificando configuración del sistema...');
        }

        const [rolEstudiante, estadoHabilitado] = await Promise.all([
            Rol.findOne({ where: { descripcion: "ESTUDIANTE" } }),
            Estado.findOne({ where: { descripcion: "HABILITADO" } })
        ]);

        if (!rolEstudiante || !estadoHabilitado) {
            throw new Error("Configuración incompleta: Rol ESTUDIANTE o Estado HABILITADO no encontrado");
        }

        // 2. RECOLECTAR TODOS LOS ESTUDIANTES ÚNICOS Y GRUPOS
        if (progressId) {
            progressService.updateProgress(progressId, 0, 'Analizando estudiantes y grupos...');
        }

        const todosLosEstudiantes = new Map();
        const gruposIds = [];

        for (const matricula of matriculas) {
            gruposIds.push({
                codigo_materia: matricula.codigo_materia,
                nombre: matricula.nombre_grupo,
                periodo: matricula.periodo,
                anio: matricula.anio
            });

            for (const est of matricula.estudiantes) {
                if (!todosLosEstudiantes.has(est.codigo)) {
                    todosLosEstudiantes.set(est.codigo, est);
                }
            }
        }

        resultados.resumen.totalEstudiantes = todosLosEstudiantes.size;

        // 3. VALIDAR TODOS LOS GRUPOS DE UNA VEZ
        if (progressId) {
            progressService.updateProgress(progressId, 0, 'Validando grupos...');
        }

        const grupos = await Grupo.findAll({
            where: { [Op.or]: gruposIds }
        });

        const gruposMap = new Map();
        grupos.forEach(g => {
            const key = `${g.codigo_materia}-${g.nombre}-${g.periodo}-${g.anio}`;
            gruposMap.set(key, g);
        });

        // Validar que todos los grupos existan y estén habilitados
        for (const matricula of matriculas) {
            const key = `${matricula.codigo_materia}-${matricula.nombre_grupo}-${matricula.periodo}-${matricula.anio}`;
            const grupo = gruposMap.get(key);

            if (!grupo) {
                resultados.errores.push({
                    grupo: matricula,
                    error: "Grupo no encontrado"
                });
                continue;
            }

            if (!grupo.estado) {
                resultados.errores.push({
                    grupo: matricula,
                    error: "El grupo no está habilitado"
                });
            }
        }

        // 4. OBTENER TODOS LOS USUARIOS EXISTENTES DE UNA VEZ
        if (progressId) {
            progressService.updateProgress(progressId, 0, 'Verificando usuarios existentes...');
        }

        const codigosEstudiantes = Array.from(todosLosEstudiantes.keys());
        const documentos = Array.from(todosLosEstudiantes.values()).map(e => e.documento);
        const correos = Array.from(todosLosEstudiantes.values()).map(e => e.correo);

        const usuariosExistentes = await Usuario.findAll({
            where: {
                [Op.or]: [
                    { codigo: { [Op.in]: codigosEstudiantes } },
                    { documento: { [Op.in]: documentos } },
                    { correo: { [Op.in]: correos } }
                ]
            }
        });

        const usuariosMap = new Map();
        usuariosExistentes.forEach(u => {
            usuariosMap.set(u.codigo, u);
            usuariosMap.set(u.documento, u);
            usuariosMap.set(u.correo, u);
        });

        // 5. OBTENER MATRICULAS EXISTENTES DE UNA VEZ
        if (progressId) {
            progressService.updateProgress(progressId, 0, 'Verificando matrículas existentes...');
        }

        const matriculasExistentes = await GrupoUsuario.findAll({
            where: {
                codigo_usuario: { [Op.in]: codigosEstudiantes },
                [Op.or]: gruposIds
            }
        });

        const matriculasMap = new Map();
        matriculasExistentes.forEach(m => {
            const key = `${m.codigo_usuario}-${m.codigo_materia}-${m.nombre}-${m.periodo}-${m.anio}`;
            matriculasMap.set(key, m);
        });

        // 6. PROCESAR ESTUDIANTES EN LOTES
        const estudiantesArray = Array.from(todosLosEstudiantes.values());
        const usuariosACrear = [];
        const firebaseUsers = new Map();

        // Identificar estudiantes que necesitan ser creados
        const estudiantesSinUsuario = estudiantesArray.filter(est =>
            !usuariosMap.has(est.codigo) &&
            !usuariosMap.has(est.documento) &&
            !usuariosMap.has(est.correo)
        );

        console.log(`📝 Estudiantes a crear: ${estudiantesSinUsuario.length}`);

        // Procesar creación de usuarios en Firebase por lotes
        for (let i = 0; i < estudiantesSinUsuario.length; i += BATCH_SIZE) {
            const batch = estudiantesSinUsuario.slice(i, i + BATCH_SIZE);
            const batchEnd = Math.min(i + BATCH_SIZE, estudiantesSinUsuario.length);

            if (progressId) {
                progressService.updateProgress(
                    progressId,
                    estudiantesProcesados,
                    `Creando usuarios en Firebase (${i + 1}-${batchEnd} de ${estudiantesSinUsuario.length})...`
                );
            }

            await Promise.all(batch.map(async (estudiante) => {
                try {
                    let userRecord = await admin.auth().createUser({
                        email: estudiante.correo,
                        emailVerified: true,
                        displayName: estudiante.nombre,
                        disabled: false
                    });

                    firebaseUsers.set(estudiante.codigo, userRecord);

                    usuariosACrear.push({
                        codigo: estudiante.codigo,
                        nombre: estudiante.nombre,
                        documento: estudiante.documento,
                        correo: estudiante.correo,
                        telefono: estudiante.telefono || null,
                        uid_firebase: userRecord.uid,
                        id_rol: rolEstudiante.id_rol,
                        id_estado: estadoHabilitado.id_estado
                    });

                    if (progressId) {
                        progressService.addSuccess(progressId, {
                            codigo: estudiante.codigo,
                            nombre: estudiante.nombre,
                            accion: 'Usuario creado en Firebase'
                        });
                    }

                } catch (firebaseError) {
                    if (firebaseError.code === 'auth/email-already-exists') {
                        try {
                            const userRecord = await admin.auth().getUserByEmail(estudiante.correo);
                            firebaseUsers.set(estudiante.codigo, userRecord);

                            usuariosACrear.push({
                                codigo: estudiante.codigo,
                                nombre: estudiante.nombre,
                                documento: estudiante.documento,
                                correo: estudiante.correo,
                                telefono: estudiante.telefono || null,
                                uid_firebase: userRecord.uid,
                                id_rol: rolEstudiante.id_rol,
                                id_estado: estadoHabilitado.id_estado
                            });

                            if (progressId) {
                                progressService.addSuccess(progressId, {
                                    codigo: estudiante.codigo,
                                    nombre: estudiante.nombre,
                                    accion: 'Usuario existente en Firebase vinculado'
                                });
                            }

                        } catch (err) {
                            console.error(`Error obteniendo usuario de Firebase: ${estudiante.correo}`, err);
                            if (progressId) {
                                progressService.addError(progressId, {
                                    codigo: estudiante.codigo,
                                    nombre: estudiante.nombre,
                                    error: `Error al obtener usuario de Firebase: ${err.message}`
                                });
                            }
                        }
                    } else {
                        console.error(`Error creando usuario en Firebase: ${estudiante.correo}`, firebaseError);
                        if (progressId) {
                            progressService.addError(progressId, {
                                codigo: estudiante.codigo,
                                nombre: estudiante.nombre,
                                error: `Error en Firebase: ${firebaseError.message}`
                            });
                        }
                    }
                }
            }));
        }

        // 7. CREAR USUARIOS EN BD EN BULK
        let usuariosCreados = [];
        if (usuariosACrear.length > 0) {
            if (progressId) {
                progressService.updateProgress(
                    progressId,
                    estudiantesProcesados,
                    `Guardando ${usuariosACrear.length} usuario(s) en base de datos...`
                );
            }

            try {
                usuariosCreados = await Usuario.bulkCreate(usuariosACrear, {
                    ignoreDuplicates: true
                });

                resultados.resumen.usuariosCreados = usuariosCreados.length;

                // Actualizar mapa de usuarios
                usuariosCreados.forEach(u => {
                    usuariosMap.set(u.codigo, u);
                });

                // Establecer custom claims en Firebase por lotes
                if (progressId) {
                    progressService.updateProgress(
                        progressId,
                        estudiantesProcesados,
                        'Configurando permisos en Firebase...'
                    );
                }

                for (let i = 0; i < usuariosCreados.length; i += BATCH_SIZE) {
                    const batch = usuariosCreados.slice(i, i + BATCH_SIZE);

                    await Promise.all(batch.map(usuario =>
                        admin.auth().setCustomUserClaims(usuario.uid_firebase, {
                            role: "ESTUDIANTE",
                            id_rol: rolEstudiante.id_rol,
                            estado: "HABILITADO"
                        }).catch(err => console.error(`Error setting claims for ${usuario.uid_firebase}`, err))
                    ));
                }

            } catch (error) {
                console.error("Error en bulkCreate de usuarios:", error);
                throw error;
            }
        }

        // 8. CREAR MATRICULAS EN BULK POR CADA GRUPO
        if (progressId) {
            progressService.updateProgress(
                progressId,
                estudiantesProcesados,
                'Iniciando proceso de matriculación...'
            );
        }

        const transaction = await db.transaction();

        try {
            for (const matricula of matriculas) {
                const grupoKey = `${matricula.codigo_materia}-${matricula.nombre_grupo}-${matricula.periodo}-${matricula.anio}`;
                const grupo = gruposMap.get(grupoKey);

                if (!grupo || !grupo.estado) continue;

                if (progressId) {
                    progressService.updateProgress(
                        progressId,
                        estudiantesProcesados,
                        `Matriculando en ${matricula.codigo_materia} - Grupo ${matricula.nombre_grupo}...`
                    );
                }

                const matriculasACrear = [];

                for (const estudiante of matricula.estudiantes) {
                    estudiantesProcesados++;

                    const usuario = usuariosMap.get(estudiante.codigo);

                    if (!usuario) {
                        resultados.errores.push({
                            estudiante,
                            grupo: matricula,
                            error: "Usuario no encontrado o no se pudo crear"
                        });

                        if (progressId) {
                            progressService.addError(progressId, {
                                codigo: estudiante.codigo,
                                nombre: estudiante.nombre,
                                error: "Usuario no encontrado"
                            });
                        }
                        continue;
                    }

                    if (usuario.id_rol !== rolEstudiante.id_rol) {
                        resultados.errores.push({
                            estudiante,
                            grupo: matricula,
                            error: "El usuario no tiene rol de estudiante"
                        });

                        if (progressId) {
                            progressService.addError(progressId, {
                                codigo: estudiante.codigo,
                                nombre: estudiante.nombre,
                                error: "No es estudiante"
                            });
                        }
                        continue;
                    }

                    const matriculaKey = `${usuario.codigo}-${matricula.codigo_materia}-${matricula.nombre_grupo}-${matricula.periodo}-${matricula.anio}`;

                    // Verificar si ya está en el mismo grupo
                    if (matriculasMap.has(matriculaKey)) {
                        resultados.errores.push({
                            estudiante,
                            grupo: matricula,
                            error: "Ya está matriculado en este grupo"
                        });

                        if (progressId) {
                            progressService.addError(progressId, {
                                codigo: estudiante.codigo,
                                nombre: estudiante.nombre,
                                error: "Ya matriculado en este grupo"
                            });
                        }
                        continue;
                    }

                    // Evitar que esté en otro grupo de la misma materia
                    const yaEnOtroGrupo = await GrupoUsuario.findOne({
                        where: {
                            codigo_usuario: usuario.codigo,
                            codigo_materia: matricula.codigo_materia,
                            periodo: matricula.periodo,
                            anio: matricula.anio,
                            nombre: { [Op.ne]: matricula.nombre_grupo }
                        }
                    });

                    if (yaEnOtroGrupo) {
                        resultados.errores.push({
                            estudiante,
                            grupo: matricula,
                            error: "Ya pertenece a otro grupo de esta materia en el mismo periodo y año"
                        });

                        if (progressId) {
                            progressService.addError(progressId, {
                                codigo: estudiante.codigo,
                                nombre: estudiante.nombre,
                                error: "Ya pertenece a otro grupo de la misma materia"
                            });
                        }
                        continue;
                    }

                    // Si pasa todas las validaciones → agregar para crear
                    matriculasACrear.push({
                        codigo_usuario: usuario.codigo,
                        codigo_materia: matricula.codigo_materia,
                        nombre: matricula.nombre_grupo,
                        periodo: matricula.periodo,
                        anio: matricula.anio,
                        fecha_ingreso: new Date(),
                        estado: false,
                        nombre_estudiante: estudiante.nombre
                    });
                }

                // Crear matriculas en bulk para este grupo
                if (matriculasACrear.length > 0) {
                    const matriculasCreadas = await GrupoUsuario.bulkCreate(matriculasACrear, {
                        transaction,
                        ignoreDuplicates: true
                    });

                    matriculasCreadas.forEach(m => {
                        const key = `${m.codigo_usuario}-${m.codigo_materia}-${m.nombre}-${m.periodo}-${m.anio}`;
                        matriculasMap.set(key, m);

                        const estudianteRelacionado = matriculasACrear.find(ma => ma.codigo_usuario === m.codigo_usuario);

                        resultados.exitosos.push({
                            codigo: m.codigo_usuario,
                            nombre: estudianteRelacionado?.nombre_estudiante || "Estudiante",
                            grupo: {
                                codigo_materia: m.codigo_materia,
                                nombre_grupo: m.nombre,
                                periodo: m.periodo,
                                anio: m.anio
                            }
                        });

                        if (progressId) {
                            progressService.addSuccess(progressId, {
                                codigo: m.codigo_usuario,
                                nombre: estudianteRelacionado?.nombre_estudiante || "Estudiante",
                                accion: `Matriculado en ${m.codigo_materia}-${m.nombre}`
                            });
                        }
                    });
                }
            }

            await transaction.commit();

            resultados.resumen.estudiantesMatriculados = resultados.exitosos.length;
            resultados.resumen.estudiantesConError = resultados.errores.length;

            if (progressId) {
                progressService.completeProgress(
                    progressId,
                    `✓ Proceso completado. ${resultados.resumen.estudiantesMatriculados} estudiante(s) matriculado(s) correctamente`
                );
            }

        } catch (error) {
            await transaction.rollback();

            if (progressId) {
                progressService.failProgress(progressId, `Error al crear matriculas: ${error.message}`);
            }

            throw new Error(`Error al crear matriculas: ${error.message}`);
        }

    } catch (error) {
        console.error("Error en matriculación masiva:", error);

        if (progressId) {
            progressService.failProgress(progressId, error.message);
        }

        throw error;
    }

    return resultados;
}

export default { matricularEstudiantesMasivamente, activarEstadoEnGrupo, listarParticipantesGrupo };