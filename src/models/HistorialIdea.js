import db from "../db/db.js";
import { DataTypes } from "sequelize";
import Estado from "./Estado.js";
import Idea from "./Idea.js";
import Usuario from "./Usuario.js";

const HistorialIdea = db.define("Historial_Idea", {
    id_historial_idea: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
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

Estado.hasMany(HistorialIdea, { foreignKey: "id_estado" });
HistorialIdea.belongsTo(Estado, { foreignKey: "id_estado" });

//Relacion con idea

Idea.hasMany(HistorialIdea, { foreignKey: "id_idea" });
HistorialIdea.belongsTo(Idea, { foreignKey: "id_idea" });

//Relacion con usuario (quien hizo el cambio)

Usuario.hasMany(HistorialIdea, { foreignKey: "codigo_usuario" });
HistorialIdea.belongsTo(Usuario, { foreignKey: "codigo_usuario" });

export default HistorialIdea;