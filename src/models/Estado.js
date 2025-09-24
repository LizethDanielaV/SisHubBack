import db from "../db/db.js";
import { DataTypes } from "sequelize";

const Estado = db.define("Estado", {
    id_estado: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
    descripcion: { type: DataTypes.STRING(15), allowNull: false}
}, {
    timestamps: false,
    freezeTableName: true
});

export default Estado;