import db from "../db/db.js";
import { DataTypes } from "sequelize";
import Grupo from "./Grupo.js";

const Actividad = db.define("actividad", {
    id_actividad: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true}, 
    titulo: {type: DataTypes.STRING(100)}, 
    descripcion: {type: DataTypes.TEXT},
    fecha_inicio: {type: DataTypes.DATEONLY}, 
    fecha_cierre: {type: DataTypes.DATEONLY}
}, {
    timestamps: false,
    freezeTableName: true
});

//relacion con Grupo
Grupo.hasMany(Actividad, {
    foreignKey: "id_grupo"
});
Actividad.belongsTo(Actividad, {
    foreignKey: "id_grupo"
});

export default Actividad;