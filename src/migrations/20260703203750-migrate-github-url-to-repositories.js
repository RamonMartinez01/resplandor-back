'use strict';

module.exports = {
  async up (queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // 1. Añadimos la nueva columna JSONB
      await queryInterface.addColumn('projects', 'repositories', {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: []
      }, { transaction });

      // 2. Migramos los datos existentes usando el superpoder de Postgres
      // Si existía un github_url, lo convertimos en [{ label: 'Código Fuente', url: '...' }]
      await queryInterface.sequelize.query(`
        UPDATE projects 
        SET repositories = jsonb_build_array(
          jsonb_build_object('label', 'Código Fuente', 'url', github_url)
        )
        WHERE github_url IS NOT NULL;
      `, { transaction });

      // 3. Eliminamos la columna obsoleta
      await queryInterface.removeColumn('projects', 'github_url', { transaction });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down (queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();
    try {
      // 1. Revertir: Añadimos la columna vieja
      await queryInterface.addColumn('projects', 'github_url', {
        type: Sequelize.STRING,
        allowNull: true
      }, { transaction });

      // 2. Intentamos recuperar el primer elemento del JSONB (si existe)
      await queryInterface.sequelize.query(`
        UPDATE projects 
        SET github_url = repositories->0->>'url'
        WHERE jsonb_array_length(repositories) > 0;
      `, { transaction });

      // 3. Eliminamos la columna nueva
      await queryInterface.removeColumn('projects', 'repositories', { transaction });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};