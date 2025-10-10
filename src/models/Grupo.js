import db from "../db/db.js";
import { DataTypes } from "sequelize";
import Materia from "./Materia.js";

const Grupo = db.define("Grupo", {
    id_grupo: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nombre: { type: DataTypes.STRING(100), allowNull: false },
    clave_acceso: { type: DataTypes.STRING(50), allowNull: false },
    estado: { type: DataTypes.BOOLEAN, defaultValue: true },
    periodo: { type: DataTypes.STRING(2), allowNull: false },
    anio: { type: DataTypes.INTEGER, allowNull: false },
}, {
    timestamps: false,
    freezeTableName: true,
    indexes: [
        {
            unique: true,
            fields: ["codigo_materia", "nombre", "periodo", "anio"],
        },
    ],
});

//relacion con materia
Materia.hasMany(Grupo, {
    foreignKey: "codigo_materia"
});
Grupo.belongsTo(Materia, {
    foreignKey: "codigo_materia"
});

export default Grupo;