import GrupoUsuarioService from "../services/GrupoUsuarioService.js";

async function unirseAGrupoPorIdYClave(req, res) {
    const { codigo_usuario, codigo_materia, nombre_grupo, periodo, anio, clave_acceso } = req.body;
    try {
        const resultado = await GrupoUsuarioService.unirseAGrupoPorIdYClave(
            codigo_usuario,
            codigo_materia,
            nombre_grupo,
            periodo,
            anio,
            clave_acceso
        );
        res.status(201).json(resultado);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
}

async function listarParticipantesGrupo(req, res) {
    const { codigo_materia, nombre_grupo, periodo, anio } = req.body;
    try {
        const resultado = await GrupoUsuarioService.listarParticipantesGrupo(
            codigo_materia,
            nombre_grupo,
            periodo,
            anio
        );
        res.status(201).json(resultado);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
}

export default { unirseAGrupoPorIdYClave, listarParticipantesGrupo };