/**
 * Configuración principal de la aplicación Express
 * Responsable de:
 * 1.- Configurar middlewares (CORS, JSON Parser)
 * 2.- Definir las rutas principales
 * 3.- Manejar errores globales
 */

const express = require('express');
const cors = require('cors');

// Importamos el enrutador centralizado
const apiRoutes = require('./routes');

const app = express();

// ===================================================================
// 1. MIDDLEWARES GLOBALES
// ===================================================================

// Configuración de CORS - ¡Crucial para que Vite pueda consumir la API!
const corsOptions = {
  origin: [
    'http://localhost:5173', 
    // 'https://dominio-produccion.com' 
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));

// Parsea los cuerpos de las peticiones HTTP que vienen en formato JSON
app.use(express.json());
// Parsea datos enviados desde formularios tradicionales (por si acaso)
app.use(express.urlencoded({ extended: true }));

// ===================================================================
// 2. RUTAS BASE Y DE SALUD (Health checks)
// ===================================================================

// Ruta de bienvenida requerida por tu index.js
app.get('/', (req, res) => {
  res.json({
    message: 'Bienvenido a la API de Resplandor (Headless CMS)',
    version: '1.0.0'
  });
});

// Ruta de health check requerida por tu index.js
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date() });
});

// ===================================================================
// 3. RUTAS DE LA API (El núcleo del CMS)
// ===================================================================

// Conectamos el enrutador central.
// Toda petición que empiece con '/api-resplandor' entrará a routes/index.js
app.use('/api-resplandor', apiRoutes);

// ===================================================================
// 4. MANEJO DE ERRORES (Fallbacks)
// ===================================================================

// Manejador para rutas no encontradas (404)
app.use((req, res, next) => {
  res.status(404).json({
    error: 'Not Found',
    message: `La ruta ${req.originalUrl} no existe en este servidor.`
  });
});

// Manejador de errores globales dinámico
app.use((err, req, res, next) => {
  // Leemos el código de nuestro ApiError, o usamos 500 por defecto si es un bug grave
  const statusCode = err.statusCode || 500;
  const statusType = err.status || 'error';

  console.error(`[Error] ${statusCode} - ${err.message}`);

  res.status(statusCode).json({
    status: statusType,
    message: err.message,
    // Opcional: mostrar el stack trace solo en desarrollo
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

module.exports = app;