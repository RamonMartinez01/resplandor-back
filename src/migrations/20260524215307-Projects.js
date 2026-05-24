'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.createTable('projects', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      slug: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
      },
      tags: {
        // Superpoder de Postgres reflejado en la migración
        type: Sequelize.ARRAY(Sequelize.STRING),
        defaultValue: [],
      },
      imageUrl: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      githubUrl: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      liveDemoUrl: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      isFeatured: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
      },
      localizedContent: {
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
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('projects');
  }
  }

 
