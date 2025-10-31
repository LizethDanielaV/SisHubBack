import EsquemaService from "../services/EsquemaService.js";

async function listarEsquemasPorTipo(req, res) {
  try {
    const { id_tipo_alcance } = req.params;
    const esquemas = await EsquemaService.listarEsquemasPorTipo(id_tipo_alcance);
    res.status(200).json(esquemas);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}

async function listarItemsPorEsquema(req, res) {
  try {
    const { id_esquema } = req.params;
    const items = await EsquemaService.listarItemsPorEsquema(id_esquema);
    res.status(200).json(items);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}

export default {
  listarEsquemasPorTipo,
  listarItemsPorEsquema,
};
