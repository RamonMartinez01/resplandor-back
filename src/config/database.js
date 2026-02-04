// src/config/database.js
const { Sequelize } = require('sequelize');
require('dotenv').config(); // Carga variables de .env

// Usamos la variable DATABASE_URL si está disponible (compatible con servicios como Heroku/Render),
// de lo contrario, construimos la URL desde las variables individuales.
const databaseUrl = process.env.DATABASE_URL || 
  `${process.env.DB_DIALECT}://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_DATABASE}`;

// Crear una nueva instancia de Sequelize
const sequelize = new Sequelize(databaseUrl, {
  dialect: 'postgres',
  logging: process.env.NODE_ENV === 'development' ? console.log : false, // Muestra SQL solo en desarrollo
  dialectOptions: {
    ssl: process.env.DB_SSL === 'true' ? { // Para conexiones en la nube (ej: Render, AWS)
      require: true,
      rejectUnauthorized: false
    } : false
  },
  define: {
    underscored: true, // Convierte camelCase a snake_case en los nombres de columnas
    timestamps: true, // Habilita createdAt y updatedAt automáticamente
  },
  pool: {
    max: 5, // Máximo de conexiones concurrentes
    min: 0,
    acquire: 30000, // Tiempo máximo (ms) para adquirir una conexión
    idle: 10000 // Tiempo máximo (ms) que una conexión puede estar inactiva
  }
});

// Función para probar la conexión a la base de datos
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Conexión a la base de datos establecida correctamente.');
    return true;
  } catch (error) {
    console.error('❌ No se pudo conectar a la base de datos:', error.message);
    return false;
  }
};

module.exports = { sequelize, testConnection };