import Area from "../models/Area.js";
import AreaService from "../services/AreaService.js";

export const crearArea = async (req, res) => {
  try {
    const { nombre } = req.body;
    if (!nombre) {
      return res.status(400).json({ error: "El nombre es requerido" });
    }

    const area = await Area.create({ nombre });
    return res.json({ ok: true, area });
  } catch (error) {
    console.error("Error en crearArea:", error);
    return res.status(500).json({ error: "Error al crear el área" });
  }
};

export async function listar(req, res) {
  try {
    const areas = await AreaService.listar();
    res.json(areas);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error al obtener areas", error: error.message });
  }
}

