import db from "../db/db.js";
import { DataTypes } from "sequelize";
import Proyecto from "./Proyecto.js";
import Equipo from "./Equipo.js";
import Actividad from "./Actividad.js";

const Entregable = db.define("entregable", {
    id_entregable: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
    tipo: {type: DataTypes.STRING(100), allowNull: false},
    nombre_archivo: {type: DataTypes.STRING(200)},
    url_archivo: { type: DataTypes.STRING(255)},
    comentarios: {type: DataTypes.STRING(200)},
    fecha_subida: {type: DataTypes.DATEONLY, defaultValue: DataTypes.NOW },
    calificacion: {type: DataTypes.DECIMAL(4, 2)}
}, {
     timestamps: false,
    freezeTableName: true
});

//relacion con proyecto
Proyecto.hasMany(Entregable, {
    foreignKey: "id_proyecto"
});
Entregable.belongsTo(Proyecto, {
    foreignKey: "id_proyecto"
});

//relacion con equipo
Equipo.hasMany(Entregable, {
    foreignKey: "id_equipo"
});
Entregable.belongsTo(Equipo, {
     foreignKey: "id_equipo"
});

//Relacion con actividad
Actividad.hasMany(Entregable, {
    foreignKey: "id_actividad"
})
Entregable.belongsTo(Actividad, {
    foreignKey: "id_actividad"
})

export default Entregable;