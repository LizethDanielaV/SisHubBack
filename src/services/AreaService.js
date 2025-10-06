import Area from "../models/Area.js";

async function listar() {
  try {
    const areas = await Area.findAll();
    return areas;
  } catch (error) {
    throw new Error("Error al obtener las areas " + error.message);
  }
}

export default {listar};