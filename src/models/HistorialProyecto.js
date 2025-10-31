import db from "../db/db.js";
import { DataTypes } from "sequelize";
import Estado from "./Estado.js";
import Proyecto from "./Proyecto.js";
import Usuario from "./Usuario.js";

const HistorialProyecto = db.define("Historial_Proyecto", {
    id_historial_proyecto: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    fecha: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        get() {
            const rawDate = this.getDataValue('fecha');
            if (!rawDate) return null;
            return new Date(rawDate).toLocaleString('es-CO', {
                timeZone: 'America/Bogota'
            });
        }
    },
    observacion: { type: DataTypes.TEXT }
}, {
    timestamps: false,
    freezeTableName: true
});

// Relacion con estado

Estado.hasMany(HistorialProyecto, { foreignKey: "id_estado" });
HistorialProyecto.belongsTo(Estado, { foreignKey: "id_estado" });

//Relacion con proyecto
Proyecto.hasMany(HistorialProyecto, { foreignKey: "id_proyecto" });
HistorialProyecto.belongsTo(Proyecto, { foreignKey: "id_proyecto" });

//Relacion con usuario (quien hizo el cambio)

Usuario.hasMany(HistorialProyecto, { foreignKey: "codigo_usuario" });
HistorialProyecto.belongsTo(Usuario, { foreignKey: "codigo_usuario" });

export default HistorialProyecto;