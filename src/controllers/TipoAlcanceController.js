import TipoAlcanceService from "../services/TipoAlcanceService.js";

async function listarTiposAlcance(req, res) {
  try {
    const tipos = await TipoAlcanceService.listarTiposAlcance();
    res.status(200).json(tipos);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
}

export default {
  listarTiposAlcance,
};
