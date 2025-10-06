import GrupoUsuarioService from "../services/GrupoUsuarioService.js";

async function unirseAGrupoPorNombreYClave(req, res) {
    const { id_usuario, nombre_grupo, clave_acceso } = req.body;
    try {
        const resultado = await GrupoUsuarioService.unirseAGrupoPorNombreYClave(id_usuario, nombre_grupo, clave_acceso);
        res.status(201).json(resultado);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
}

export default { unirseAGrupoPorNombreYClave };