import db from "../db/db.js";
import { DataTypes } from "sequelize";
import TipoAlcance from "./TipoAlcance.js";

const Esquema = db.define("Esquema", {
    id_esquema: { type: DataTypes.STRING(50), primaryKey: true},
    ubicacion: { type: DataTypes.STRING(50)}
}, {
    timestamps: false,
    freezeTableName: true
});

TipoAlcance.hasMany(Esquema, {
    foreignKey: "id_tipo_alcance"
});
Esquema.belongsTo(TipoAlcance, {
     foreignKey: "id_tipo_alcance"
});

export default Esquema;