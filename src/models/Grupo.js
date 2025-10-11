import db from "../db/db.js";
import { DataTypes } from "sequelize";
import Materia from "./Materia.js";

const Grupo = db.define("Grupo", {
    codigo_materia: { type: DataTypes.STRING(20), allowNull: false, primaryKey: true },
    nombre: { type: DataTypes.STRING(1), allowNull: false,primaryKey: true  },
    periodo: { type: DataTypes.STRING(2), allowNull: false, primaryKey: true  },
    anio: { type: DataTypes.INTEGER, allowNull: false, primaryKey: true  },
    clave_acceso: { type: DataTypes.STRING(50), allowNull: false },
    estado: { type: DataTypes.BOOLEAN, defaultValue: true },
}, {
    timestamps: false,
    freezeTableName: true,
});

//relacion con materia
Materia.hasMany(Grupo, {
    foreignKey: "codigo_materia"
});
Grupo.belongsTo(Materia, {
    foreignKey: "codigo_materia"
});

export default Grupo;