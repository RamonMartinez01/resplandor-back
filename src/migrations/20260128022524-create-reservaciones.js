'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('reservaciones', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      huesped_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'huespedes',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT' // No borrar si hay reservaciones
      },
      fecha_inicio: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      fecha_fin: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      estado_pago: {
        type: Sequelize.ENUM('pendiente', 'pago-50-porciento', 'pagado-total'),
        allowNull: false,
        defaultValue: 'pendiente'
      },
      monto_total: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
      },
      anticipo_pagado: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      },
      vehiculo: {
        type: Sequelize.STRING(100),
        allowNull: false,
        defaultValue: 'No'
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
    await queryInterface.addIndex('reservaciones', ['huesped_id']);
    await queryInterface.addIndex('reservaciones', ['usuario_id']);
    await queryInterface.addIndex('reservaciones', ['fecha_inicio']);
    await queryInterface.addIndex('reservaciones', ['fecha_fin']);
    await queryInterface.addIndex('reservaciones', ['estado_pago']);
    
    // Índice compuesto para búsquedas por fechas
    await queryInterface.addIndex('reservaciones', ['fecha_inicio', 'fecha_fin']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('reservaciones');
  }
};