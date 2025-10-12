import { Router } from "express";
import GrupoController from "../controllers/GrupoController.js";
import multer from "multer";
import fs from "fs";
const router = Router();


// Configurar multer (guarda los archivos en /uploads temporalmente)
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = "uploads/";
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir);
        }
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + "-" + file.originalname);
    },
});

const upload = multer({ storage });

router.post("/", GrupoController.crearGrupo);
router.patch("/actualizar-estado", GrupoController.actualizarEstado);
router.get("/generar-clave", GrupoController.generarClaveAcceso);
router.get("/:codigo_materia/:nombre/:periodo/:anio/generar-qr", GrupoController.generarCodigoQR);
router.post("/clave-y-qr", GrupoController.obtenerClaveYCodigoQR);
router.get("/materia/:codigo_materia", GrupoController.listarGruposPorMateria);
router.get("/materia/:codigo_materia/habilitados", GrupoController.listarGruposHabilitadosPorMateria);
router.get("/usuario/:codigo_usuario", GrupoController.listarGruposPorUsuario);
router.get("/", GrupoController.listarTodosLosGrupos);
router.get("/filtrar", GrupoController.filtrarGrupos);
router.post("/cargar-csv", upload.single("file"), GrupoController.cargarGruposDesdeCSV);

export default router;