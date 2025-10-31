import db from "../db/db.js";
import { DataTypes } from "sequelize";
import Estado from "./Estado.js";
import Entregable from "./Entregable.js";
import Usuario from "./Usuario.js";

const HistorialEntregable = db.define("Historial_Entregable", {
    id_historial_entregable: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    fecha: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    observacion: { type: DataTypes.TEXT }
}, {
    timestamps: false,
    freezeTableName: true
});

// Relacion con estado

Estado.hasMany(HistorialEntregable, { foreignKey: "id_estado" });
HistorialEntregable.belongsTo(Estado, { foreignKey: "id_estado" });

//Relacion con entregable
Entregable.hasMany(HistorialEntregable, { foreignKey: "id_entregable" });
HistorialEntregable.belongsTo(Entregable, { foreignKey: "id_entregable" });

//Relacion con usuario (quien hizo el cambio)

Usuario.hasMany(HistorialEntregable, { foreignKey: "codigo_usuario" });   
HistorialEntregable.belongsTo(Usuario, { foreignKey: "codigo_usuario" });

export default HistorialEntregable;