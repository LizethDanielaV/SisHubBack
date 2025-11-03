import db from "../db/db.js";
import { DataTypes } from "sequelize";
import Esquema from "./Esquema.js";

const Item = db.define("Item", {
    id_item: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
    nombre: {type: DataTypes.STRING(50), allowNull: false}
}, {
    timestamps: false,
    freezeTableName: true
});

//relacion con él mismo
Item.hasMany(Item, {
    foreignKey: "super_item"
});
Item.belongsTo(Item, {
    foreignKey: "super_item"
})

//relacion con esquema
Esquema.hasMany(Item, {
    foreignKey: "id_esquema"
})
Item.belongsTo(Esquema, {
    foreignKey: "id_esquema"
})

export default Item;