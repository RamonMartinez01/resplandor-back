'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('usuarios', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      email: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true
        }
      },
      password_hash: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      nombre_completo: {
        type: Sequelize.STRING(150),
        allowNull: false
      },
      rol: {
        type: Sequelize.ENUM('admin', 'operador_a', 'operador_b'),
        allowNull: false,
        defaultValue: 'admin'
      },
      img_url: {
        type: Sequelize.STRING(500),
        allowNull: true,
        comment: 'URL de imagen de perfil (Cloudinary)'
      },
      activo: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
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

    // Índices adicionales para mejorar rendimiento
    await queryInterface.addIndex('usuarios', ['email'], {
      name: 'usuarios_email_idx',
      unique: true
    });

    await queryInterface.addIndex('usuarios', ['rol'], {
      name: 'usuarios_rol_idx'
    });

    await queryInterface.addIndex('usuarios', ['activo'], {
      name: 'usuarios_activo_idx'
    });

    // Comentario para la tabla (útil en PostgreSQL)
    await queryInterface.sequelize.query(
      "COMMENT ON TABLE usuarios IS 'Tabla de usuarios del sistema con roles de administración'"
    );
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('usuarios');
  }
};