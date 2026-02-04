const express = require('express');
const reservacionesController = require('../controllers/reservaciones.controller');
const authenticate = require('../middleware/auth.middleware');

const reservacionesRouter = express.Router();
const devRouter = express.Router();

// ============================================
// RUTAS DE DESARROLLO (sin autenticación)
// ============================================

// GET /api/reservaciones/dev - Todas las reservaciones (solo desarrollo)
devRouter.get('/reservaciones/dev', reservacionesController.getAllForDev);

// ============================================
// RUTAS PRINCIPALES (con autenticación)
// ============================================

// Aplicar autenticación a todas las rutas principales
reservacionesRouter.use(authenticate);

// Rutas principales de reservaciones
reservacionesRouter.route('/')
  .get(reservacionesController.getAll)      // GET /api/reservaciones - Todas las reservaciones
  .post(reservacionesController.create);    // POST /api/reservaciones - Crear reservación

// Ruta para reservaciones activas
reservacionesRouter.get('/activas', reservacionesController.getActivas); // GET /api/reservaciones/activas

// Ruta para búsqueda
reservacionesRouter.get('/buscar', reservacionesController.search); // GET /api/reservaciones/buscar?params

reservacionesRouter.route('/:id')
  .get(reservacionesController.getOne)      // GET /api/reservaciones/:id - Una reservación
  .put(reservacionesController.update)      // PUT /api/reservaciones/:id - Actualizar
  .delete(reservacionesController.remove);  // DELETE /api/reservaciones/:id - Eliminar

module.exports = {
  reservacionesRouter,
  devRouter
};