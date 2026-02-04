'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('checklist_items', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      checklist_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'checklists',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      nombre: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      descripcion: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      texto_adicional: {
        type: Sequelize.STRING(250),
        allowNull: true,
        comment: 'Campo para anotaciones del usuario'
      },
      completado: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      fecha_completado: {
        type: Sequelize.DATE,
        allowNull: true
      },
      completado_por_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'usuarios',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      importancia: {
        type: Sequelize.ENUM('critico', 'importante', 'seguimiento'),
        allowNull: false,
        defaultValue: 'importante'
      },
      es_default: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'Indica si es un item por defecto'
      },
      dias_relativo: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Días relativos a fecha_inicio: null=inmediato, -5=5 días antes, 0=al terminar'
      },
      notificar_al_crear: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'Notificar al crear la reservación'
      },
      notificar_x_dias_antes: {
        type: Sequelize.ARRAY(Sequelize.INTEGER),
        allowNull: true,
        comment: 'Array de días para notificar antes (ej: [5, 1])'
      },
      notificar_al_terminar: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'Notificar al terminar la estancia'
      },
      orden: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
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
    await queryInterface.addIndex('checklist_items', ['checklist_id']);
    await queryInterface.addIndex('checklist_items', ['completado_por_id']);
    await queryInterface.addIndex('checklist_items', ['usuario_id']);
    await queryInterface.addIndex('checklist_items', ['es_default']);
    await queryInterface.addIndex('checklist_items', ['importancia']);
    await queryInterface.addIndex('checklist_items', ['completado']);
    await queryInterface.addIndex('checklist_items', ['orden']);
    await queryInterface.addIndex('checklist_items', ['dias_relativo']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('checklist_items');
  }
};