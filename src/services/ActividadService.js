import Actividad from "../models/Actividad.js";
import TipoAlcance from "../models/TipoAlcance.js";
import Grupo from "../models/Grupo.js";
import Esquema from "../models/Esquema.js";
import Item from "../models/Item.js";
import ActividadItem from "../models/ActividadItem.js";
import db from "../db/db.js";
import Entregable from "../models/Entregable.js";

async function crearActividad(titulo, descripcion, fecha_inicio, fecha_cierre,
    maximo_integrantes, codigo_materia, nombre, periodo, anio, id_tipo_alcance, items_seleccionados = []) {
    const transaction = await db.transaction();
    try {
        if (!titulo || !descripcion || !fecha_inicio || !fecha_cierre || !maximo_integrantes || !id_tipo_alcance) {
            throw new Error("Completa todos los campos obligatorios");
        }

        const grupo = await Grupo.findOne({ where: { codigo_materia, nombre, periodo, anio } });
        if (!grupo) throw new Error("Grupo no encontrado");

        const tipo = await TipoAlcance.findByPk(id_tipo_alcance);
        if (!tipo) throw new Error("Tipo de alcance no válido");

        const nuevaActividad = await Actividad.create({
            titulo, descripcion, fecha_inicio, fecha_cierre,
            maximo_integrantes, codigo_materia, nombre, periodo, anio, id_tipo_alcance
        }, { transaction });

        if (items_seleccionados.length > 0) {
            // Verificar que los ítems existan y correspondan al mismo tipo de alcance
            const itemsValidos = await Item.findAll({ where: { id_item: items_seleccionados } });

            if (itemsValidos.length !== items_seleccionados.length) {
                throw new Error("Uno o más ítems seleccionados no existen");
            }

            // 🔎 Validar que todos los ítems pertenecen a esquemas del mismo tipo de alcance
            for (const item of itemsValidos) {
                const esquema = await item.getEsquema();
                if (esquema.id_tipo_alcance !== id_tipo_alcance) {
                    throw new Error(`El ítem '${item.nombre}' no pertenece al tipo de alcance seleccionado`);
                }
            }

            const registros = itemsValidos.map(item => ({
                id_actividad: nuevaActividad.id_actividad,
                id_item: item.id_item,
            }));

            await ActividadItem.bulkCreate(registros, { transaction });
        }

        await transaction.commit();
        return nuevaActividad;
    } catch (error) {
        await transaction.rollback();
        throw new Error("Error al crear la actividad: " + error.message);
    }
}



async function editarActividad(
  id_actividad,
  { titulo, descripcion, fecha_inicio, fecha_cierre, maximo_integrantes, id_tipo_alcance, items_seleccionados = [] }
) {
  const transaction = await db.transaction();

  try {
    const actividad = await Actividad.findByPk(id_actividad);
    if (!actividad) throw new Error("Actividad no encontrada");

    // Verificar si ya existen entergables asociadas
    const entregables = await Entregable.findAll({ where: { id_actividad } });
    if (entregables.length > 0)
      throw new Error("No se puede editar la actividad porque ya existen entregables para esta");

    // Validar tipo de alcance
    const tipo = await TipoAlcance.findByPk(id_tipo_alcance);
    if (!tipo) throw new Error("Tipo de alcance no válido");

    // Actualizar información base
    await actividad.update(
      {
        titulo,
        descripcion,
        fecha_inicio,
        fecha_cierre,
        maximo_integrantes,
        id_tipo_alcance,
      },
      { transaction }
    );

    // 🔄 Actualizar ítems seleccionados
    await ActividadItem.destroy({ where: { id_actividad }, transaction });

    if (items_seleccionados.length > 0) {
      const itemsValidos = await Item.findAll({ where: { id_item: items_seleccionados } });

      if (itemsValidos.length !== items_seleccionados.length)
        throw new Error("Uno o más ítems seleccionados no existen");

      // Validar que los ítems pertenezcan al tipo de alcance correcto
      for (const item of itemsValidos) {
        const esquema = await item.getEsquema();
        if (esquema.id_tipo_alcance !== id_tipo_alcance) {
          throw new Error(`El ítem '${item.nombre}' no pertenece al tipo de alcance seleccionado`);
        }
      }

      const nuevosRegistros = itemsValidos.map((item) => ({
        id_actividad,
        id_item: item.id_item,
      }));

      await ActividadItem.bulkCreate(nuevosRegistros, { transaction });
    }

    await transaction.commit();
    return actividad;
  } catch (error) {
    await transaction.rollback();
    throw new Error("Error al editar la actividad: " + error.message);
  }
}

export default {
    crearActividad, editarActividad
};