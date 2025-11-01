import db from "../db/db.js";
import { DataTypes } from "sequelize";
import Proyecto from "./Proyecto.js";
import Equipo from "./Equipo.js";
import Actividad from "./Actividad.js";
import Estado from "./Estado.js";

const Entregable = db.define("entregable", {
    id_entregable: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    tipo: { type: DataTypes.STRING(100), allowNull: false },
    nombre_archivo: { type: DataTypes.STRING(200) },
    url_archivo: { type: DataTypes.STRING(500) },
    comentarios: { type: DataTypes.STRING(200) },
    fecha_subida: { 
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        get() {
            const rawDate = this.getDataValue('fecha_subida');
            if (!rawDate) return null;
            return new Date(rawDate).toLocaleString('es-CO', {
                timeZone: 'America/Bogota'
            });
        }
    },
    calificacion: { type: DataTypes.DECIMAL(4, 2) }
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


// Relacion con Estado
Estado.hasMany(Entregable, { foreignKey: "id_estado" });
Entregable.belongsTo(Estado, { foreignKey: "id_estado" });

export default Entregable;