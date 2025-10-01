import Area from "../models/Area.js";

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