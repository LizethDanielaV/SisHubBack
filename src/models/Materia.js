import db from "../db/db.js";
import { DataTypes } from "sequelize";
import Area from "./Area.js";

const Materia = db.define("Materia", {
    codigo: {type: DataTypes.STRING(20), primaryKey: true},
    nombre: {type: DataTypes.STRING(100), allowNull: false},
    semestre: { type: DataTypes.STRING(2), allowNull: false},
    creditos: {type: DataTypes.INTEGER, allowNull: false}, 
    prerrequisitos: {type: DataTypes.STRING(100)},
    tipo: {type: DataTypes.STRING(100)}
}, {
    timestamps: false,
    freezeTableName: true
});

//relacion con area
Area.hasMany(Materia, {
    foreignKey: "id_area"
});
Materia.belongsTo(Area, {
    foreignKey: "id_area"
});

export default Materia;