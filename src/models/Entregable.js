import db from "../db/db.js";
import { DataTypes } from "sequelize";
import Proyecto from "./Proyecto.js";

const Entregable = db.define("entregable", {
    id_entregable: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
    tipo: {type: DataTypes.STRING(100), allowNull: false},
    nombre_archivo: {type: DataTypes.STRING(200)},
    url_archivo: { type: DataTypes.STRING(255)},
    decripcion: {type: DataTypes.STRING(200)},
    fecha_subida: {type: DataTypes.DATEONLY, defaultValue: DataTypes.NOW },
    extension: {type: DataTypes.STRING(10)}, 
    tamaño:{ type: DataTypes.BIGINT}
}, {
     timestamps: false,
    freezeTableName: true
});

//relacion con proyecto
Proyecto.hasMany(Entregable, {
    foreignKey: "id_proyecto"
});
Entregable.belongsTo(Proyecto, {
    foreignKey: "id_proyecto"
});

export default Entregable;