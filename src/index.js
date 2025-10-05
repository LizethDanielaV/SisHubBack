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

dotenv.config({ path: path.resolve("../.env") });


const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:5173", 
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


const PORT = process.env.PUERTO || 3000;


// Levantar servidor
app.listen(PORT, () => {
  console.log(`API escuchando en http://localhost:${PORT}`);
});
