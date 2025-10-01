export async function up(queryInterface, Sequelize) {
  await queryInterface.changeColumn("Usuario", "contrasena", {
    type: Sequelize.STRING(255),
    allowNull: true,
  });
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.changeColumn("Usuario", "contrasena", {
    type: Sequelize.STRING(255),
    allowNull: false, // o como estaba originalmente
  });
}