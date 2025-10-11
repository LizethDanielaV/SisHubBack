export async function up(queryInterface, Sequelize) {
  // 1️⃣ Eliminar constraints viejas si existen
  await queryInterface.removeConstraint("actividad", "actividad_ibfk_1").catch(() => {});
  await queryInterface.removeConstraint("grupo_usuario", "grupo_usuario_ibfk_2").catch(() => {});
  await queryInterface.removeConstraint("Grupo", "PRIMARY").catch(() => {});
  await queryInterface.removeConstraint("Grupo", "fk_grupo_materia_codigo").catch(() => {});

  // 2️⃣ Asegurar columnas en Grupo
  await queryInterface.changeColumn("Grupo", "codigo_materia", {
    type: Sequelize.STRING(20),
    allowNull: false,
  });
  await queryInterface.changeColumn("Grupo", "nombre", {
    type: Sequelize.STRING(1),
    allowNull: false,
  });
  await queryInterface.changeColumn("Grupo", "periodo", {
    type: Sequelize.STRING(2),
    allowNull: false,
  });
  await queryInterface.changeColumn("Grupo", "anio", {
    type: Sequelize.INTEGER,
    allowNull: false,
  });

  // 3️⃣ Crear clave primaria compuesta
  await queryInterface.addConstraint("Grupo", {
    fields: ["codigo_materia", "nombre", "periodo", "anio"],
    type: "primary key",
    name: "pk_grupo_compuesta",
  });

  // 4️⃣ Restaurar FK hacia Materia
  await queryInterface.addConstraint("Grupo", {
    fields: ["codigo_materia"],
    type: "foreign key",
    name: "fk_grupo_materia_codigo",
    references: {
      table: "Materia",
      field: "codigo",
    },
    onUpdate: "CASCADE",
    onDelete: "CASCADE",
  });

  // 5️⃣ Actividad → Grupo
  await queryInterface.removeColumn("actividad", "id_grupo").catch(() => {});

  await queryInterface.addColumn("actividad", "codigo_materia", {
    type: Sequelize.STRING(20),
    allowNull: false,
  });
  await queryInterface.addColumn("actividad", "nombre", {
    type: Sequelize.STRING(1),
    allowNull: false,
  });
  await queryInterface.addColumn("actividad", "periodo", {
    type: Sequelize.STRING(2),
    allowNull: false,
  });
  await queryInterface.addColumn("actividad", "anio", {
    type: Sequelize.INTEGER,
    allowNull: false,
  });

  await queryInterface.addConstraint("actividad", {
    fields: ["codigo_materia", "nombre", "periodo", "anio"],
    type: "foreign key",
    name: "fk_actividad_grupo_compuesta",
    references: {
      table: "Grupo",
      fields: ["codigo_materia", "nombre", "periodo", "anio"],
    },
    onUpdate: "CASCADE",
    onDelete: "CASCADE",
  });

  // 6️⃣ GrupoUsuario → Grupo
  await queryInterface.removeColumn("grupo_usuario", "id_grupo").catch(() => {});

  await queryInterface.addColumn("grupo_usuario", "codigo_materia", {
    type: Sequelize.STRING(20),
    allowNull: false,
  });
  await queryInterface.addColumn("grupo_usuario", "nombre", {
    type: Sequelize.STRING(1),
    allowNull: false,
  });
  await queryInterface.addColumn("grupo_usuario", "periodo", {
    type: Sequelize.STRING(2),
    allowNull: false,
  });
  await queryInterface.addColumn("grupo_usuario", "anio", {
    type: Sequelize.INTEGER,
    allowNull: false,
  });

  await queryInterface.addConstraint("grupo_usuario", {
    fields: ["codigo_materia", "nombre", "periodo", "anio"],
    type: "foreign key",
    name: "fk_grupousuario_grupo_compuesta",
    references: {
      table: "Grupo",
      fields: ["codigo_materia", "nombre", "periodo", "anio"],
    },
    onUpdate: "CASCADE",
    onDelete: "CASCADE",
  });
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.removeConstraint("actividad", "fk_actividad_grupo_compuesta").catch(() => {});
  await queryInterface.removeConstraint("grupo_usuario", "fk_grupousuario_grupo_compuesta").catch(() => {});
  await queryInterface.removeConstraint("Grupo", "pk_grupo_compuesta").catch(() => {});
  await queryInterface.removeConstraint("Grupo", "fk_grupo_materia_codigo").catch(() => {});

  for (const tabla of ["actividad", "grupo_usuario"]) {
    for (const col of ["codigo_materia", "nombre", "periodo", "anio"]) {
      await queryInterface.removeColumn(tabla, col).catch(() => {});
    }
  }

  await queryInterface.addColumn("actividad", "id_grupo", {
    type: Sequelize.INTEGER,
    allowNull: true,
  });
  await queryInterface.addColumn("grupo_usuario", "id_grupo", {
    type: Sequelize.INTEGER,
    allowNull: true,
  });

  await queryInterface.addColumn("Grupo", "id_grupo", {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  });
}
