import db from "../db/db.js";
import { DataTypes } from "sequelize";
import Grupo from "./Grupo.js";

const Actividad = db.define("actividad", {
    id_actividad: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    titulo: { type: DataTypes.STRING(100) },
    descripcion: { type: DataTypes.TEXT },
    fecha_inicio: { type: DataTypes.DATEONLY },
    fecha_cierre: { type: DataTypes.DATEONLY },
    maximo_integrantes: { type: DataTypes.INTEGER },
    codigo_materia: { type: DataTypes.STRING(20), allowNull: false },
    nombre: { type: DataTypes.STRING(1), allowNull: false },
    periodo: { type: DataTypes.STRING(2), allowNull: false },
    anio: { type: DataTypes.INTEGER, allowNull: false },
}, {
    timestamps: false,
    freezeTableName: true
});

// Relación con Grupo (clave compuesta)
Grupo.hasMany(Actividad, {
  foreignKey: ["codigo_materia", "nombre", "periodo", "anio"],
});
Actividad.belongsTo(Grupo, {
  foreignKey: ["codigo_materia", "nombre", "periodo", "anio"],
});

//Relacion con tipo_alcance



export default Actividad;