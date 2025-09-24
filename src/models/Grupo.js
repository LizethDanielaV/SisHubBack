import db from "../db/db.js";
import { DataTypes } from "sequelize";
import Materia from "./Materia.js";

const Grupo = db.define("Grupo", {
    id_grupo: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true}, 
    clave_acceso: {type: DataTypes.STRING(50), allowNull: false}, 
    estado: { type: DataTypes.BOOLEAN, defaultValue: true}, 
    semestre: { type: DataTypes.STRING(2)}
}, {
    timestamps: false,
    freezeTableName: true
}); 

//relacion con materia
Materia.hasMany(Grupo, {
    foreignKey: "id_materia"
});
Grupo.belongsTo(Materia, {
    foreignKey: "id_materia"
});

export default Grupo;