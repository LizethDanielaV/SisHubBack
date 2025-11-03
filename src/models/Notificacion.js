import db from "../db/db.js";
import { DataTypes } from "sequelize";
import Usuario from "./Usuario.js";
import Mensaje from "./Mensaje.js";

const Notificacion = db.define("Notificacion", {
    id_notificacion: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    leida: { type: DataTypes.BOOLEAN, defaultValue: false }
}, {
    timestamps: false,
    freezeTableName: true
})

// Relacion con Usuario (destinatario)

Usuario.hasMany(Notificacion, {
    foreignKey: "id_destinatario"
})

Notificacion.belongsTo(Usuario, {
    foreignKey: "id_destinatario"
})

// Relacion con Mensaje

Mensaje.hasMany(Notificacion, { foreignKey: "id_mensaje" });
Notificacion.belongsTo(Mensaje, { foreignKey: "id_mensaje" });

export default Notificacion;