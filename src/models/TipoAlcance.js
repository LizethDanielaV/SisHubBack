import db from "../db/db.js";
import { DataTypes } from "sequelize";
import Esquema from "./Esquema.js";

const TipoAlcance = db.define("Tipo_alcance",{
    id_tipo_alcance: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
    nombre: {type: DataTypes.STRING(100), allowNull: false}
}, {
     timestamps: false,
    freezeTableName: true
});


export default TipoAlcance;