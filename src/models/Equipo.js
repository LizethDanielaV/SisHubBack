import db from "../db/db.js";
import { DataTypes } from "sequelize";
import Proyecto from "./Proyecto.js";
import Usuario from "./Usuario.js";

const Equipo = db.define("equipo", {
    id_equipo: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
    rol_equipo: {type: DataTypes.STRING(15)}
});

//Relacion con proyecto
Proyecto.hasMany(Equipo, {
    foreignKey: "id_proyecto"
});
Equipo.belongsTo(Proyecto, {
    foreignKey: "id_proyecto"
});

//relacion con estudiante
Usuario.hasMany(Equipo, {
    foreignKey: "id_usuario_estudiante"
});
Equipo.belongsTo(Usuario, {
    foreignKey: "id_usuario_estudiante"
});

export default Equipo;