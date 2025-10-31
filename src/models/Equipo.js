import db from "../db/db.js";
import { DataTypes } from "sequelize";
import Grupo from "./Grupo.js";

const Equipo = db.define("equipo", {
    id_equipo: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    descripcion: { type: DataTypes.STRING(50) },
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

// Relación con Grupo (clave compuesta)
Grupo.hasMany(Equipo, {
    foreignKey: ["codigo_materia", "nombre", "periodo", "anio"],
});
Equipo.belongsTo(Grupo, {
    foreignKey: ["codigo_materia", "nombre", "periodo", "anio"],
});

export default Equipo;