import GrupoService from "../services/GrupoService.js";

async function crearGrupo(req, res) {

    try {
        const grupo = await GrupoService.crearGrupo(
            req.body.codigo_materia,
            req.body.nombre,
            req.body.periodo,
            req.body.anio,
            req.body.clave_acceso,
            req.body.codigo_docente
        );
        res.status(201).json(grupo);
    }
    catch (error) {
        res.status(error.statusCode || 500).json({
            message: error.message || "Error interno del servidor",
        });
    }

}

async function cargarGruposDesdeCSV(req, res) {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "Debe adjuntar un archivo CSV." });
        }

        const filePath = req.file.path;
        const resultado = await GrupoService.cargarGruposDesdeCSV(filePath);

        res.status(200).json({
            message: "Procesamiento completado",
            resultado
        });
    } catch (error) {
        console.error("Error al cargar los grupos desde CSV:", error);
        return res
            .status(500)
            .json({ message: "Error al procesar el archivo CSV.", error: error.message });
    }
}



async function actualizarEstado(req, res) {
    try {
        const { codigo_materia, nombre, periodo, anio, nuevoEstado } = req.body;
        const grupoActualizado = await GrupoService.actualizarEstado(codigo_materia, nombre, periodo, anio, nuevoEstado);
        res.status(200).json(grupoActualizado);
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


async function generarCodigoQR(req, res) {
    try {
        const { codigo_materia, nombre, periodo, anio } = req.params;
        const resultado = await GrupoService.generarCodigoQR(codigo_materia, nombre, periodo, anio);
        res.status(200).json(resultado);
    } catch (error) {
        res.status(error.statusCode || 500).json({
            message: error.message || "Error interno al generar el código QR"
        });
    }
}

async function obtenerClaveYCodigoQR(req, res) {
    try {
        const { codigo_materia, nombre, periodo, anio } = req.body;
        const resultado = await GrupoService.obtenerClaveYCodigoQR(codigo_materia, nombre, periodo, anio);
        res.status(200).json(resultado);
    } catch (error) {
        res.status(error.statusCode || 500).json({
            message: error.message || "Error interno al obtener la clave y el código QR"
        });
    }
}

async function listarGruposPorMateria(req, res) {
    try {
        const { codigo_materia } = req.params;
        const grupos = await GrupoService.listarGruposPorMateria(codigo_materia);
        res.status(200).json(grupos);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}



async function listarGruposHabilitadosPorMateria(req, res) {
    try {
        const { codigo_materia } = req.params;
        const grupos = await GrupoService.listarGruposHabilitadosPorMateria(codigo_materia);
        res.status(200).json(grupos);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

async function listarGruposPorUsuario(req, res) {
    try {
        const { codigo_usuario } = req.params;
        const grupos = await GrupoService.listarGruposPorUsuario(codigo_usuario);
        res.status(200).json(grupos);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

async function listarTodosLosGrupos(req, res) {
    try {
        const grupos = await GrupoService.listarTodosLosGrupos();
        res.status(200).json(grupos);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

async function filtrarGrupos(req, res) {
    try {
        const { codigo_materia, tipo_materia, area_conocimiento } = req.query;
        const filtros = {
            codigo_materia,
            tipo_materia,
            area_conocimiento
        };
        const grupos = await GrupoService.filtrarGrupos(filtros);
        res.status(200).json(grupos);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

export default {
    crearGrupo, actualizarEstado, generarClaveAcceso, generarCodigoQR, obtenerClaveYCodigoQR,
    listarGruposPorMateria, listarGruposHabilitadosPorMateria, listarGruposPorUsuario, listarTodosLosGrupos, filtrarGrupos, cargarGruposDesdeCSV
};