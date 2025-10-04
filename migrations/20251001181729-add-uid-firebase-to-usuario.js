export async function up(queryInterface, Sequelize) {
  await queryInterface.addColumn("Usuario", "uid_firebase", {
    type: Sequelize.STRING(128),
    allowNull: true,
    unique: true
  });
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.removeColumn("Usuario", "uid_firebase");
}