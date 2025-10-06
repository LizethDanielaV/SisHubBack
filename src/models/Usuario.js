import db from "../db/db.js";
import { DataTypes } from "sequelize";
import Rol from "./Rol.js";
import Estado from "./Estado.js";

const Usuario  = db.define("Usuario", {
    id_usuario: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
    codigo: { type: DataTypes.STRING(10), allowNull: false},
    nombre: { type: DataTypes.STRING(100), allowNull: false},
    documento: {type: DataTypes.STRING(20), unique: true, allowNull: false},
    correo: {type: DataTypes.STRING(100), unique: true, allowNull: false}, 
    telefono: {type: DataTypes.STRING(20)},
    contrasena: { type: DataTypes.STRING(255), allowNull: true },
    uid_firebase: { type: DataTypes.STRING(128), unique: true, allowNull: true }
},{
    timestamps: false,
    freezeTableName: true
});

//relacion con rol
Rol.hasMany(Usuario, {
    foreignKey: "id_rol"
});
Usuario.belongsTo(Rol, {
    foreignKey: "id_rol"
});

//relacion con estado
Estado.hasMany(Usuario, {
    foreignKey: "id_estado"
});
Usuario.belongsTo(Estado, {
    foreignKey: "id_estado"
});

export default Usuario;