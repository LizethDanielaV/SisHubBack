import db from "../db/db.js";
import { DataTypes } from "sequelize";
import Area from "./Area.js";

const Materia = db.define("Materia", {
    id_materia: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true}, 
    codigo: {type: DataTypes.STRING(20), allowNull: false, unique: true},
    nombre: {type: DataTypes.STRING(100), allowNull: false},
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