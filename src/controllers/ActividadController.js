import ActividadService from "../services/ActividadService.js";

async function crearActividad(req, res) {
  try {
    const {
      titulo,
      descripcion,
      fecha_inicio,
      fecha_cierre,
      maximo_integrantes,
      codigo_materia,
      nombre,
      periodo,
      anio,
      id_tipo_alcance,
      items_seleccionados = [],
    } = req.body;

    const nuevaActividad = await ActividadService.crearActividad(
      titulo,
      descripcion,
      fecha_inicio,
      fecha_cierre,
      maximo_integrantes,
      codigo_materia,
      nombre,
      periodo,
      anio,
      id_tipo_alcance,
      items_seleccionados
    );

    res.status(201).json({
      message: "Actividad creada exitosamente",
      actividad: nuevaActividad,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}

async function editarActividad(req, res) {
  try {
    const { id_actividad } = req.params;
    const {
      titulo,
      descripcion,
      fecha_inicio,
      fecha_cierre,
      maximo_integrantes,
      id_tipo_alcance,
      items_seleccionados,
    } = req.body;

    const actividadEditada = await ActividadService.editarActividad(id_actividad, {
      titulo,
      descripcion,
      fecha_inicio,
      fecha_cierre,
      maximo_integrantes,
      id_tipo_alcance,
      items_seleccionados,
    });

    res.status(200).json({
      message: "Actividad actualizada correctamente",
      actividad: actividadEditada,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}


export default {
  crearActividad,editarActividad
};
