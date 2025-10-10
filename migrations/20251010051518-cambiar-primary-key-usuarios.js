export async function up(queryInterface, Sequelize) {
  // 1️⃣ Eliminar constraints que dependan de Usuario
  await queryInterface.removeConstraint("grupo_usuario", "grupo_usuario_ibfk_1").catch(() => {});
  await queryInterface.removeConstraint("equipo", "equipo_ibfk_2").catch(() => {});

  // 2️⃣ Eliminar la primary key existente en Usuario
  // await queryInterface.removeConstraint("Usuario", "PRIMARY").catch(() => {});

  // 3️⃣ Eliminar columna id_usuario
  // await queryInterface.removeColumn("Usuario", "id_usuario").catch(() => {});

  // 4️⃣ Cambiar la columna codigo a primary key
  await queryInterface.changeColumn("Usuario", "codigo", {
    type: Sequelize.STRING(10),
    allowNull: false,
    primaryKey: true
  });

  // 5️⃣ Agregar columnas nuevas para relaciones foráneas
  await queryInterface.addColumn("grupo_usuario", "codigo_usuario", {
    type: Sequelize.STRING(10),
    allowNull: true
  });

  await queryInterface.addColumn("equipo", "codigo_usuario_estudiante", {
    type: Sequelize.STRING(10),
    allowNull: true
  });

  // 6️⃣ Volver a crear las relaciones foráneas
  await queryInterface.addConstraint("grupo_usuario", {
    fields: ["codigo_usuario"],
    type: "foreign key",
    name: "fk_grupousuario_codigo",
    references: {
      table: "Usuario",
      field: "codigo",
    },
    onUpdate: "CASCADE",
    onDelete: "SET NULL",
  });

  await queryInterface.addConstraint("equipo", {
    fields: ["codigo_usuario_estudiante"],
    type: "foreign key",
    name: "fk_equipo_codigo_estudiante",
    references: {
      table: "Usuario",
      field: "codigo",
    },
    onUpdate: "CASCADE",
    onDelete: "SET NULL",
  });

  // 7️⃣ Eliminar columnas viejas
  await queryInterface.removeColumn("grupo_usuario", "id_usuario").catch(() => {});
  await queryInterface.removeColumn("equipo", "id_usuario_estudiante").catch(() => {});
}

export async function down(queryInterface, Sequelize) {
  // 1️⃣ Quitar nuevas FK
  await queryInterface.removeConstraint("grupo_usuario", "fk_grupousuario_codigo").catch(() => {});
  await queryInterface.removeConstraint("equipo", "fk_equipo_codigo_estudiante").catch(() => {});

  // 2️⃣ Eliminar columnas de FK nuevas
  await queryInterface.removeColumn("grupo_usuario", "codigo_usuario").catch(() => {});
  await queryInterface.removeColumn("equipo", "codigo_usuario_estudiante").catch(() => {});

  // 3️⃣ Restaurar id_usuario como PK autoincremental
  await queryInterface.addColumn("Usuario", "id_usuario", {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  });

  // 4️⃣ Quitar PK de codigo y dejarla única
  await queryInterface.changeColumn("Usuario", "codigo", {
    type: Sequelize.STRING(10),
    allowNull: false,
    unique: true
  });
}
