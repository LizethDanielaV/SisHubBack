import express from "express";
import path from "path";
import cors from "cors";
import dotenv from "dotenv";

import db, { testConnection } from "./db/db.js";

// Importar rutas
import usuarioRoutes from "./routes/usuarios.js";
import areaRoutes from "./routes/areas.js";
import materiasRoutes from "./routes/materias.js"
import grupoRoutes from "./routes/grupos.js";

dotenv.config(); 


const app = express();

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
  origin: function (origin, callback) {
    // Permitir requests sin origin (como Postman/Thunder Client)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ["GET","PATCH","POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());

// Conectar DB
testConnection();

// Rutas
app.use("/api/usuarios", usuarioRoutes);
app.use("/api/areas", areaRoutes);
app.use("/api/materias", materiasRoutes);
app.use("/api/grupos", grupoRoutes);


// Ruta base
app.get("/", (req, res) => {
  res.send("API funcionando 🚀");
});


const PORT = process.env.PORT || process.env.PUERTO || 3000;


// Levantar servidor
app.listen(PORT, () => {
  console.log(`API escuchando en http://localhost:${PORT}`);
});
