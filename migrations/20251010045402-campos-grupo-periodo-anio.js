export async function up(queryInterface, Sequelize) {
  // 1️⃣ Agregar columnas periodo y anio (si no existen)
  await queryInterface.addColumn("Grupo", "periodo", {
    type: Sequelize.STRING(2),
    allowNull: false
  }).catch(() => {});

  await queryInterface.addColumn("Grupo", "anio", {
    type: Sequelize.INTEGER,
    allowNull: false
  }).catch(() => {});

  // 2️⃣ Crear restricción única para evitar duplicados
  await queryInterface.addConstraint("Grupo", {
    fields: ["codigo_materia", "nombre", "periodo", "anio"],
    type: "unique",
    name: "unique_grupo_materia_nombre_periodo_anio",
  }).catch(() => {});
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.removeConstraint("Grupo", "unique_grupo_materia_nombre_periodo_anio").catch(() => {});
  await queryInterface.removeColumn("Grupo", "periodo").catch(() => {});
  await queryInterface.removeColumn("Grupo", "anio").catch(() => {});
}
