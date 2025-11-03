import { Router } from "express";
import multer from "multer";
import EntregableController from "../controllers/EntregableController.js";
import { verificarToken } from "../middlewares/auth.js";
import { verificarRol } from "../middlewares/roles.js";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024 // 100MB
  },
  fileFilter: (req, file, cb) => {
    const tipo = req.body.tipo?.toUpperCase();
    
    if (tipo === 'DOCUMENTO') {
      const allowedMimes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];
      
      if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Solo se permiten archivos PDF o Word'));
      }
    } 
    else if (tipo === 'VIDEO') {
      const allowedMimes = ['video/mp4', 'video/avi', 'video/mkv', 'video/mov'];
      
      if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Solo se permiten archivos de video'));
      }
    }
    else if (tipo === 'AUDIO') {
      const allowedMimes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg'];
      
      if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Solo se permiten archivos de audio'));
      }
    }
    else if (tipo === 'IMAGEN') {
      const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      
      if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Solo se permiten archivos de imagen'));
      }
    }
    else {
      cb(null, true);
    }
  }
});

router.get("/tipos", EntregableController.obtenerTiposEntregable);
router.post("/crear",/*   verificarToken, verificarRol([3]),  */upload.single('archivo'), EntregableController.crearEntregable);
router.put(
  "/:id_entregable",
  // verificarToken,
  // verificarRol([3]),
  upload.single('archivo'),
  EntregableController.actualizarEntregable
);

router.get(
  "/proyecto/:id_proyecto/actividad/:id_actividad",
  // verificarToken,
  EntregableController.obtenerEntregablesPorProyectoYActividad
);

router.post(
  "/extraer-texto",
  // verificarToken,
  upload.single('archivo'),
  EntregableController.extraerTextoDocumento
);

router.post("/proyecto/:id_proyecto/enviar-revision",EntregableController.enviarProyectoARevision);


router.put(
    "/retroalimentar/:id_entregable",
    //   verificarToken,verificarRol([1, 2]), 
    EntregableController.retroalimentarEntregable
);

export default router;
