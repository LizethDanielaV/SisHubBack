export async function up(queryInterface, Sequelize) {

  // 1️⃣ Eliminar la foreign key existente entre Grupo y Materia (si existe)
  await queryInterface.removeConstraint("Grupo", "Grupo_ibfk_1").catch(() => {});

  // 1. Eliminar la clave primaria actual
 await queryInterface.removeConstraint("Materia", "PRIMARY").catch(() => {});


  // 2. Eliminar la columna id_materia (si existe)
  await queryInterface.removeColumn("Materia", "id_materia").catch(() => {});

  // 3. Modificar la columna 'codigo' para que sea la nueva clave primaria
  await queryInterface.changeColumn("Materia", "codigo", {
    type: Sequelize.STRING(20),
    allowNull: false,
    primaryKey: true
  });

  // 4. En la tabla Grupo, reemplazar la relación a Materia
  await queryInterface.addColumn("Grupo", "codigo_materia", {
    type: Sequelize.STRING(20),
    allowNull: true
  });

  // 5. Crear la relación nueva con clave foránea
  await queryInterface.addConstraint("Grupo", {
    fields: ["codigo_materia"],
    type: "foreign key",
    name: "fk_grupo_materia_codigo",
    references: {
      table: "Materia",
      field: "codigo"
    },
    onUpdate: "CASCADE",
    onDelete: "SET NULL"
  });

  // 6. Eliminar columna vieja (id_materia) si ya existe en Grupo
  await queryInterface.removeColumn("Grupo", "id_materia").catch(() => {});
}

export async function down(queryInterface, Sequelize) {
  // Revertir los cambios (volver a id_materia como PK)
  await queryInterface.removeConstraint("Grupo", "fk_grupo_materia_codigo");
  await queryInterface.removeColumn("Grupo", "codigo_materia");

  await queryInterface.addColumn("Materia", "id_materia", {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true
  });

  await queryInterface.changeColumn("Materia", "codigo", {
    type: Sequelize.STRING(20),
    allowNull: false,
    unique: true
  });

  // 3️⃣ Agregar la columna id_materia de nuevo a Grupo
  await queryInterface.addColumn("Grupo", "id_materia", {
    type: Sequelize.INTEGER,
    allowNull: true
  });

  // 4️⃣ Volver a crear la foreign key original
  await queryInterface.addConstraint("Grupo", {
    fields: ["id_materia"],
    type: "foreign key",
    name: "Grupo_ibfk_1",
    references: {
      table: "Materia",
      field: "id_materia"
    },
    onUpdate: "CASCADE",
    onDelete: "SET NULL"
  });
}