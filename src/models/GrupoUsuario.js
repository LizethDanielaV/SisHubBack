import db from "../db/db.js";
import { DataTypes } from "sequelize";
import Usuario from "./Usuario.js";
import Grupo from "./Grupo.js";

const GrupoUsuario = db.define("grupo_usuario", {
    id_grupo_usuario: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true}, 
    fecha_ingreso: {type: DataTypes.DATEONLY, defaultValue: DataTypes.NOW}
}, {
    timestamps: false,
    freezeTableName: true
});

//relacion con Usuario
Usuario.hasMany(GrupoUsuario, {
    foreignKey: "codigo_usuario"
});
GrupoUsuario.belongsTo(Usuario, {
    foreignKey: "codigo_usuario"
});

//relacion con Grupo
Grupo.hasMany(GrupoUsuario, {
    foreignKey: "id_grupo"
});
GrupoUsuario.belongsTo(Grupo, {
    foreignKey: "id_grupo"
});

export default GrupoUsuario;