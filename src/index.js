import express from "express";
import db, { testConnection, createTables }from "./db/db.js";
import Rol from "./models/Rol.js";
import Estado from "./models/Estado.js";
import Usuario from "./models/Usuario.js";
import Area from "./models/Area.js";
import Materia from "./models/Materia.js";
import Grupo from "./models/Grupo.js";
import GrupoUsuario from "./models/GrupoUsuario.js";
import Actividad from "./models/Actividad.js";
import Proyecto from "./models/Proyecto.js";
import Entregable from "./models/Entregable.js";
import Equipo from "./models/Equipo.js";
import path from "path"; //para pasarle la ruta
import dotenv from "dotenv"; //cargar variables de entorno
dotenv.config({ path: path.resolve("../.env") });//le digo en donde esta especificamente el .env


const app = express();
app.use(express.json());

//configuracion del puerto
app.listen(process.env.PUERTO, () => {
  console.log(`API escuchando en http://localhost:${process.env.PUERTO}`);
});

app.get("/", (req, res) => {
  res.send("Api funcionando");
});

// Llamadas a funciones de DB
testConnection(); 
createTables(); // Para crear las tablas de la bd, luego de crearlas, comentar