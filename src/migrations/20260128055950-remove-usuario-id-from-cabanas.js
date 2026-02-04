'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Eliminar la restricción de clave foránea primero
    await queryInterface.removeConstraint('cabanas', 'cabanas_usuario_id_fkey');
    
    // Eliminar la columna usuario_id
    await queryInterface.removeColumn('cabanas', 'usuario_id');
    
    // Eliminar el índice asociado
    await queryInterface.removeIndex('cabanas', 'cabanas_usuario_id');
  },

  async down(queryInterface, Sequelize) {
    // En el down, volver a agregar la columna
    await queryInterface.addColumn('cabanas', 'usuario_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'usuarios',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });
    
    // Volver a crear el índice
    await queryInterface.addIndex('cabanas', ['usuario_id'], {
      name: 'cabanas_usuario_id'
    });
  }
};