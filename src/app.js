/**
 * Configuración principal de la aplicación Express
 * Responsable de:
 * 1.- Configurar middlewares (CORS, JSON Parser)
 * 2.- Definir las rutas principales
 * 3.- Manejar errores globales
 */

const express = require('express');
const cors = require('cors');

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

// Aquí conectaremos nuestro controlador de contenido más adelante.
// Por ahora, dejamos un "placeholder" o mock para comprobar que la ruta funciona.
app.use('/api-resplandor/content', (req, res) => {
  res.json({ message: 'Ruta de contenido lista para ser implementada.' });
});

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

// Manejador de errores globales (500)
app.use((err, req, res, next) => {
  console.error('❌ Error capturado en el middleware global:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Algo salió mal en el servidor.'
  });
});

module.exports = app;