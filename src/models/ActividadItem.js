import db from "../db/db.js";
import { DataTypes } from "sequelize";
import Item from "./Item.js";
import Actividad from "./Actividad.js";

const ActividadItem = db.define("Actividad_item", {
    id_item_seleccionado: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true }
}, {
    timestamps: false,
    freezeTableName: true
});

//relacion con Item
Item.hasMany(ActividadItem, {
    foreignKey: "id_item"
});
ActividadItem.belongsTo(Item, {
    foreignKey: "id_item"
})

//relacion con actividad
Actividad.hasMany(ActividadItem, {
    foreignKey: "id_actividad"
});
ActividadItem.belongsTo(Actividad, {
    foreignKey: "id_actividad"
})

export default ActividadItem;