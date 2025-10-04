import { Router } from "express";
import MateriaController from "../controllers/MateriaController.js";

const router = Router();

router.post("/", MateriaController.crear);
router.put("/:id_materia", MateriaController.actualizar);
export default router;
