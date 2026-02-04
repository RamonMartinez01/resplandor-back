'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('reservacion_cabanas', {
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
      cabana_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'cabanas',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Índices compuesto único para evitar duplicados
    await queryInterface.addIndex('reservacion_cabanas', 
      ['reservacion_id', 'cabana_id'],
      {
        unique: true,
        name: 'reservacion_cabana_unique'
      }
    );

    // Índices individuales para búsquedas
    await queryInterface.addIndex('reservacion_cabanas', ['reservacion_id']);
    await queryInterface.addIndex('reservacion_cabanas', ['cabana_id']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('reservacion_cabanas');
  }
};