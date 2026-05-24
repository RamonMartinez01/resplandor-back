'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
   await queryInterface.createTable('content_blocks', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
      },
      section: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      locale: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      payload: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: {},
      },
      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      }
    });

    // Añadimos el índice compuesto único que definimos en el modelo
    await queryInterface.addIndex('content_blocks', ['section', 'locale'], {
      unique: true,
      name: 'content_blocks_section_locale_unique'
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.dropTable('content_blocks');
  }
};
