import db from "../db/db.js";
import { DataTypes } from "sequelize";
import Estado from "./Estado.js";
import Usuario from "./Usuario.js";
import Grupo from "./Grupo.js";

const Idea = db.define("Idea", {
  id_idea: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  titulo: { type: DataTypes.STRING(50) },
  problema: { type: DataTypes.TEXT },
  justificacion: { type: DataTypes.TEXT },
  objetivo_general: { type: DataTypes.STRING(100) },
  objetivos_especificos: { type: DataTypes.TEXT },
  // Claves foráneas hacia Grupo (compuesta)
  codigo_materia: { type: DataTypes.STRING(20), allowNull: false },
  nombre: { type: DataTypes.STRING(1), allowNull: false },
  periodo: { type: DataTypes.STRING(2), allowNull: false },
  anio: { type: DataTypes.INTEGER, allowNull: false },
}, {
  timestamps: false,
  freezeTableName: true
});


// Relacion con Estado
Estado.hasMany(Idea, { foreignKey: "id_estado" });
Idea.belongsTo(Estado, { foreignKey: "id_estado" });

// Relacion con Usuario
Usuario.hasMany(Idea, { foreignKey: "codigo_usuario" });
Idea.belongsTo(Usuario, { foreignKey: "codigo_usuario" });


// Relación con Grupo (clave compuesta)
// Grupo.hasMany(Idea, {
//   foreignKey: ["codigo_materia", "nombre", "periodo", "anio"],
// });
// Idea.belongsTo(Grupo, {
//   foreignKey: ["codigo_materia", "nombre", "periodo", "anio"],
// });
export default Idea;
