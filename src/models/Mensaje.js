import db from "../db/db.js";
import { DataTypes } from "sequelize";
import Usuario from "./Usuario.js";

const Mensaje = db.define("Mensaje", {
    id_mensaje: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    titulo: { type: DataTypes.STRING(200), allowNull: false },
    mensaje: { type: DataTypes.TEXT, allowNull: false },
    fecha_envio: { type: DataTypes.DATE, defaultValue: DataTypes.NOW  }
}, {
    timestamps: false,
    freezeTableName: true
});

//Relacion con el usuario remitente

Usuario.hasMany(Mensaje, {
    foreignKey: "remitente"
});
Mensaje.belongsTo(Usuario, {
    foreignKey: "remitente"
});

export default Mensaje;
