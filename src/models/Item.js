import db from "../db/db.js";
import { DataTypes } from "sequelize";

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

export default Item;