'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('checklists', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      reservacion_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'reservaciones',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      usuario_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'usuarios',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Índices
    await queryInterface.addIndex('checklists', ['reservacion_id'], {
      unique: true, // Una reservación tiene un solo checklist
      name: 'checklists_reservacion_id_unique'
    });
    await queryInterface.addIndex('checklists', ['usuario_id']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('checklists');
  }
};