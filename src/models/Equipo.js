import db from "../db/db.js";
import { DataTypes } from "sequelize";
import Proyecto from "./Proyecto.js";
import Usuario from "./Usuario.js";

const Equipo = db.define("equipo", {
    id_equipo: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    rol_equipo: { type: DataTypes.STRING(15) }
}, {
    timestamps: false,
    freezeTableName: true
});

//relacion con estudiante
Usuario.hasMany(Equipo, {
    foreignKey: "codigo_usuario_estudiante"
});
Equipo.belongsTo(Usuario, {
    foreignKey: "codigo_usuario_estudiante"
});

export default Equipo;