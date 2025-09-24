import db from "../db/db.js";
import { DataTypes } from "sequelize";

const Area = db.define("Area", {
    id_area: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nombre: { type: DataTypes.STRING(100)}
}, {
    timestamps: false,
    freezeTableName: true
});

export default Area;