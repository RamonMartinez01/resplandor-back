/**
 * Configuración principal de la aplicación Express.
 * Este archivo configura todos los middlewares, rutas base y manejo de errores.
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { sequelize } = require('./config/database');
require('dotenv').config();
const Usuario = require('./models/usuario');

// Importar utilities y clases de error
const ApiError = require('./utils/apiError');
const { errorConverter, errorHandler } = require('./middleware/error.middleware');

// Inicializar la aplicación Express
const app = express();

// Importar rutas
const routes = require('./routes');


// ============================================================================
// 1. MIDDLEWARES DE SEGURIDAD Y LOGGING
// ============================================================================

// Helmet: Seguridad HTTP headers
app.use(helmet());

// Morgan: Logging de solicitudes HTTP
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// CORS (Cross-Origin Resource Sharing)
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

// ============================================================================
// 2. MIDDLEWARES DE PARSING
// ============================================================================

app.use(express.json({
  limit: '10mb'
}));

app.use(express.urlencoded({
  extended: true,
  limit: '10mb'
}));

// ============================================================================
// 3. RUTAS DE LA API
// ============================================================================

// Health check
app.get('/health', async (req, res) => {
  try {
    await sequelize.authenticate();
    
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error.message,
      environment: process.env.NODE_ENV || 'development'
    });
  }
});

// Ruta de bienvenida
app.get('/', (req, res) => {
  res.json({
    message: 'Bienvenido a la API de Resplandor - Sistema de Gestión de Cabañas',
    version: '1.0.0',
    documentation: 'En construcción',
    endpoints: {
      health: '/health',
      huespedes: '/api-resplandor/huespedes',
      cabanas: '/api-resplandor/cabanas',
      reservaciones: '/api-resplandor/reservaciones',
      checklist: '/api-resplandor/checklist'
    }
  });
});

// Y en una ruta de prueba (solo desarrollo):
if (process.env.NODE_ENV === 'development') {
  app.get('/api/dev/test-model', async (req, res) => {
    try {
      const count = await Usuario.count();
      res.json({
        success: true,
        message: 'Modelo Usuario cargado correctamente',
        usuarios_registrados: count
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error cargando modelo',
        error: error.message
      });
    }
  });
}

// ============================================================================
// 4. RUTAS PRINCIPALES (Placeholder por ahora)
// ============================================================================

app.use('/api-resplandor', routes)

// ============================================================================
// 5. MANEJO DE ERRORES
// ============================================================================

// Middleware para rutas no encontradas (404)
app.use((req, res, next) => {
  next(new ApiError(404, `Ruta no encontrada: ${req.method} ${req.originalUrl}`));
});

// Convertir errores de Express a ApiError
app.use(errorConverter);

// Manejador final de errores
app.use(errorHandler);

// ============================================================================
// 6. EXPORTACIÓN
// ============================================================================

module.exports = app;