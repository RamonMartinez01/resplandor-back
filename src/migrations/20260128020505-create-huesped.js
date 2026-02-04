'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('huespedes', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      nombre: {
        type: Sequelize.STRING(150),
        allowNull: false
      },
      automovil_uno: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      automovil_dos: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      automovil_tres: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      email: {
        type: Sequelize.STRING(255),
        allowNull: true,
        validate: {
          isEmail: true
        }
      },
      telefono: {
        type: Sequelize.STRING(20),
        allowNull: true
      },
      notas: {
        type: Sequelize.TEXT,
        allowNull: true
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
    await queryInterface.addIndex('huespedes', ['email']);
    await queryInterface.addIndex('huespedes', ['usuario_id']);
    await queryInterface.addIndex('huespedes', ['nombre']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('huespedes');
  }
};