import db from "../db/db.js";
import { DataTypes } from "sequelize";
import Usuario from "./Usuario.js";
import Grupo from "./Grupo.js";

const GrupoUsuario = db.define("grupo_usuario", {
  id_grupo_usuario: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  fecha_ingreso: { type: DataTypes.DATEONLY, defaultValue: DataTypes.NOW },

  // Claves foráneas hacia Grupo (compuesta)
  codigo_materia: { type: DataTypes.STRING(20), allowNull: false },
  nombre: { type: DataTypes.STRING(1), allowNull: false },
  periodo: { type: DataTypes.STRING(2), allowNull: false },
  anio: { type: DataTypes.INTEGER, allowNull: false },
  estado: { type: DataTypes.BOOLEAN, defaultValue: false },
}, {
  timestamps: false,
  freezeTableName: true
});

//relacion con Usuario
Usuario.hasMany(GrupoUsuario, {
  foreignKey: "codigo_usuario"
});
GrupoUsuario.belongsTo(Usuario, {
  foreignKey: "codigo_usuario"
});

// Relación con Grupo (clave compuesta)
Grupo.hasMany(GrupoUsuario, {
  foreignKey: ["codigo_materia", "nombre", "periodo", "anio"],
});
GrupoUsuario.belongsTo(Grupo, {
  foreignKey: ["codigo_materia", "nombre", "periodo", "anio"],
});

export default GrupoUsuario;