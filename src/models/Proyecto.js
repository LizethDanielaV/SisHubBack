import db from "../db/db.js";
import { DataTypes } from "sequelize";
import Estado from "./Estado.js";
import Actividad from "./Actividad.js";

const Proyecto = db.define("proyecto", {
    id_proyecto: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
    titulo: {type: DataTypes.STRING(150)},
    descripcion: {type: DataTypes.STRING(150)},
    objetivo_general: {type: DataTypes.STRING(150)},
    fecha_creacion: {type: DataTypes.DATEONLY, defaultValue: DataTypes.NOW }
}, {
     timestamps: false,
    freezeTableName: true
});

//relacion con estado
Estado.hasMany(Proyecto, {
    foreignKey: "id_estado"
});
Proyecto.belongsTo(Estado, {
    foreignKey: "id_estado"
});

//relacion con actividad
Actividad.hasMany(Proyecto, {
    foreignKey: "id_actividad"
});
Proyecto.belongsTo(Actividad, {
    foreignKey: "id_actividad"
});

export default Proyecto;

