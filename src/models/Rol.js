import db from "../db/db.js";
import { DataTypes } from "sequelize";

const Rol = db.define("Rol",{
    id_rol: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
    descripcion: {type: DataTypes.STRING(100), allowNull: false},
}, {
     timestamps: false,
    freezeTableName: true
});

export default Rol;