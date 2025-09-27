import { Sequelize } from "sequelize";
import path from "path";
import dotenv from "dotenv"; //cargar variables de entorno
dotenv.config({ path: path.resolve("../.env") });

//para bd local
//aca el 3er parametro es la contraseña, si la tienen vacia la dejan con ""
// const db= new Sequelize("SisHubLocal", "root", "root", {
//     host: "localhost",
//     port: 3307, //cambienlo al que tengan ustedes
//     dialect: "mysql"
// });

//Para bd desplegada
const db = new Sequelize(process.env.MYSQL_URL, {
   define: { timestamps: false },
});


// Función para probar la conexión con la db
export async function testConnection() {
  try {
    await db.authenticate();
    console.log("Database connection successful");
  } catch (error) {
    console.error("Connection error:", error);
  }
}

// Función para crear las tablas
export async function createTables() {
  try {
    await db.sync({ force: true });
    console.log("Tablas creadas exitosamente");
  } catch (error) {
    console.error("Error al crear tablas:", error.message);
  }
}

export default db;