import GrupoService from "../services/GrupoService.js";


async function crearGrupo(req, res) {

    try {
        const grupo = await GrupoService.crearGrupo(
            req.body.nombre,
            req.body.clave_acceso,
            req.body.semestre,
            req.body.id_materia,
            req.body.id_docente
        );
        res.status(201).json(grupo);
    }
    catch (error) {
        res.status(error.statusCode || 500).json({
            message: error.message || "Error interno del servidor",
        });
    }

}


async function deshabilitarGrupo(req, res) {
    try {
        const { id_grupo } = req.params;
        const grupoDeshabilitado = await GrupoService.deshabilitarGrupo(id_grupo);
        res.status(200).json(grupoDeshabilitado);
    } catch (error) {
        res.status(error.statusCode || 500).json({
            message: error.message || "Error interno del servidor",
        });
    }
}

function generarClaveAcceso(req, res) {
    try {
        const clave = GrupoService.generarClaveAcceso();
        return res.status(200).json({ clave_acceso: clave });
    } catch (error) {
        res.status(500).json({ message: "Error al generar la clave de acceso", error: error.message });
    }
}
export default { crearGrupo, deshabilitarGrupo, generarClaveAcceso };