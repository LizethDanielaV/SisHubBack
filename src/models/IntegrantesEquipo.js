import db from "../db/db.js";
import { DataTypes } from "sequelize";
import Usuario from "./Usuario.js";
import Equipo from "./Equipo.js";

const IntegranteEquipo = db.define("Integrante_Equipo", {
    id_integrante_equipo: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    rol_equipo: { type: DataTypes.STRING(50) },
    es_lider: { type: DataTypes.BOOLEAN}
}, {
    timestamps: false,
    freezeTableName: true
});

Usuario.hasMany(IntegranteEquipo, {
    foreignKey: "codigo_usuario"
});
IntegranteEquipo.belongsTo(Usuario, {
    foreignKey: "codigo_usuario"
});


Equipo.hasMany(IntegranteEquipo, {
    foreignKey: "id_equipo"
});
IntegranteEquipo.belongsTo(Equipo, {
    foreignKey: "id_equipo"
});

export default IntegranteEquipo;