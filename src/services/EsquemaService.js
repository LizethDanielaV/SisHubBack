import Esquema from "../models/Esquema.js";
import Item from "../models/Item.js";
import TipoAlcance from "../models/TipoAlcance.js";

async function listarEsquemasPorTipo(id_tipo_alcance) {
  try {
    const tipo = await TipoAlcance.findByPk(id_tipo_alcance);
    if (!tipo) throw new Error("Tipo de alcance no válido");

    const esquemas = await Esquema.findAll({
      where: { id_tipo_alcance },
      attributes: ["id_esquema", "ubicacion"],
    });

    return esquemas;
  } catch (error) {
    throw new Error("Error al listar esquemas: " + error.message);
  }
}

async function listarItemsPorEsquema(id_esquema) {
  try {
    const esquema = await Esquema.findByPk(id_esquema);
    if (!esquema) throw new Error("Esquema no encontrado");

    const items = await Item.findAll({
      where: { id_esquema },
      attributes: ["id_item", "nombre", "super_item"],
      order: [["id_item", "ASC"]],
    });

    // Reconstruir jerarquía
    const map = {};
    items.forEach(item => {
      map[item.id_item] = { ...item.dataValues, subitems: [] };
    });

    const rootItems = [];
    items.forEach(item => {
      if (item.super_item) {
        map[item.super_item].subitems.push(map[item.id_item]);
      } else {
        rootItems.push(map[item.id_item]);
      }
    });

    return rootItems;
  } catch (error) {
    throw new Error("Error al listar ítems: " + error.message);
  }
}

export default {
  listarEsquemasPorTipo,
  listarItemsPorEsquema,
};
