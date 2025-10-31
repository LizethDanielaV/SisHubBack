import TipoAlcance from "../models/TipoAlcance.js";

async function listarTiposAlcance() {
  try {
    const tipos = await TipoAlcance.findAll({
      attributes: ["id_tipo_alcance", "nombre"],
      order: [["id_tipo_alcance", "ASC"]],
    });

    return tipos;
  } catch (error) {
    throw new Error("Error al listar los tipos de alcance: " + error.message);
  }
}

export default {
  listarTiposAlcance,
};
