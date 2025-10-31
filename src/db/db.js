import { Sequelize } from "sequelize";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import dotenv from "dotenv";

// Obtener __dirname en módulos ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Cargar variables de entorno desde la raíz del proyecto
dotenv.config({ path: resolve(__dirname, "../../.env") });

// Verificar que la URL se cargó correctamente
console.log("MYSQL_URL cargada:", process.env.MYSQL_URL ? "✓" : "✗ (undefined)");

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
    await db.sync({ alter: true });
    console.log("Tablas creadas exitosamente");
  } catch (error) {
    console.error("Error al crear tablas:", error.message);
  }
}


export default db;