import db from "../db/db.js";
import { DataTypes } from "sequelize";
import Usuario from "./Usuario.js";
// NO importes Grupo aquí para evitar la relación automática

const GrupoUsuario = db.define("grupo_usuario", {
  id_grupo_usuario: { 
    type: DataTypes.INTEGER, 
    primaryKey: true, 
    autoIncrement: true 
  },
  codigo_usuario: {
    type: DataTypes.STRING(20),
    allowNull: false
  },
  codigo_materia: { 
    type: DataTypes.STRING(20), 
    allowNull: false
  },
  nombre: { 
    type: DataTypes.STRING(1), 
    allowNull: false
  },
  periodo: { 
    type: DataTypes.STRING(2), 
    allowNull: false
  },
  anio: { 
    type: DataTypes.INTEGER, 
    allowNull: false
  },
  fecha_ingreso: { 
    type: DataTypes.DATEONLY, 
    defaultValue: DataTypes.NOW 
  },
  estado: { 
    type: DataTypes.BOOLEAN, 
    defaultValue: false 
  },
}, {
  timestamps: false,
  freezeTableName: true
});

// Relación SOLO con Usuario (esta sí funciona bien)
Usuario.hasMany(GrupoUsuario, {
  foreignKey: "codigo_usuario",
  sourceKey: "codigo"
});

GrupoUsuario.belongsTo(Usuario, {
  foreignKey: "codigo_usuario",
  targetKey: "codigo"
});

// NO defines relación con Grupo aquí
// Sequelize no maneja bien claves compuestas en relaciones

export default GrupoUsuario;