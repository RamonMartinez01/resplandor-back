const express = require('express');
const huespedesController = require('../controllers/huespedes.controller');
const authenticate = require('../middleware/auth.middleware');

const huespedesRouter = express.Router();

// Todas las rutas requieren autenticación
huespedesRouter.use(authenticate);

// Rutas principales de huéspedes
huespedesRouter.route('/')
  .get(huespedesController.getAll)     // GET /api/huespedes - Todos los huéspedes
  .post(huespedesController.create);   // POST /api/huespedes - Crear huésped

huespedesRouter.route('/buscar')
  .get(huespedesController.search);    // GET /api/huespedes/buscar?query=... - Buscar huéspedes

huespedesRouter.route('/:id')
  .get(huespedesController.getOne)     // GET /api/huespedes/:id - Un huésped
  .put(huespedesController.update)     // PUT /api/huespedes/:id - Actualizar
  .delete(huespedesController.remove); // DELETE /api/huespedes/:id - Eliminar

module.exports = huespedesRouter;