import GrupoUsuarioService from "../services/GrupoUsuarioService.js";

async function unirseAGrupoPorIdYClave(req, res) {
    const { id_usuario, id_grupo, clave_acceso } = req.body;
    try {
        const resultado = await GrupoUsuarioService.unirseAGrupoPorIdYClave(id_usuario, id_grupo, clave_acceso);
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