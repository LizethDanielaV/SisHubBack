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
    const { id_grupo } = req.params;
    try {
        const resultado = await GrupoUsuarioService.listarParticipantesGrupo(id_grupo);
        res.status(200).json(resultado);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

export default { unirseAGrupoPorIdYClave, listarParticipantesGrupo };