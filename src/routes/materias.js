import { Router } from "express";
import MateriaController from "../controllers/MateriaController.js";

const router = Router();

router.post("/", MateriaController.crear);

export default router;
