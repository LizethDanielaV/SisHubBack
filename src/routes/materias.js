import { Router } from "express";
import MateriaController from "../controllers/MateriaController.js";
import { verificarToken } from "../middlewares/auth.js";
import { verificarRol } from "../middlewares/roles.js";
import multer from "multer";

const router = Router();
const upload = multer({ dest: "uploads/" });

router.post("/crear/upload-csv", /*verificarToken, verificarRol([1]), */upload.single("archivo"), MateriaController.subirCSV);
router.post("/", /*verificarToken, verificarRol([1]),*/ MateriaController.crear);
router.get("/codigos", verificarToken, verificarRol([1, 2, 3]), MateriaController.listarCodigos);
router.put("/:id_materia", verificarToken, verificarRol([1]), MateriaController.actualizar);
router.get("/", verificarToken, verificarRol([1, 2, 3]),  MateriaController.listar);
router.get("/:id_materia", verificarToken, verificarRol([1, 2, 3]), MateriaController.buscarPorId);

export default router;
