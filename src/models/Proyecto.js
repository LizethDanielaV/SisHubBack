import db from "../db/db.js";
import { DataTypes } from "sequelize";
import Idea from "./Idea.js";
import TipoAlcance from "./TipoAlcance.js";
import Estado from "./Estado.js";

const Proyecto = db.define("proyecto", {
    id_proyecto: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    linea_investigacion: { type: DataTypes.STRING(150) },
    tecnologias: { type: DataTypes.STRING(150) },
    palabras_clave: { type: DataTypes.STRING(150) },
    fecha_creacion: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, {
    timestamps: false,
    freezeTableName: true
});


//relacion con Idea
Idea.hasMany(Proyecto, {
    foreignKey: "id_idea"
});
Proyecto.belongsTo(Idea, {
    foreignKey: "id_idea"
});


//RElacion con tipo de alcance

TipoAlcance.hasMany(Proyecto, {
    foreignKey: "id_tipo_alcance"
});
Proyecto.belongsTo(TipoAlcance, {
    foreignKey: "id_tipo_alcance"
});


//Relacion con estado
Estado.hasMany(Proyecto, { foreignKey: "id_estado" });
Proyecto.belongsTo(Estado, { foreignKey: "id_estado" });

export default Proyecto;

