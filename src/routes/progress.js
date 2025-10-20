import express from "express";
import { verificarToken } from "../middlewares/auth.js";
import { verificarRol } from "../middlewares/roles.js";
import { progressService } from "../services/progressService.js";

const router = express.Router();

router.get("/:progressId", verificarToken, verificarRol([1]), (req, res) => {
  const { progressId } = req.params;
  const progress = progressService.getProgress(progressId);

  if (!progress) {
    return res.status(404).json({ error: "Progreso no encontrado" });
  }

  const porcentaje = progress.total
    ? Math.round((progress.current / progress.total) * 100)
    : 0;

  res.json({ ...progress, porcentaje });
});

export default router;
