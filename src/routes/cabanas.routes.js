const express = require('express');
const cabanasController = require('../controllers/cabanas.controller');
const authenticate = require('../middleware/auth.middleware');

const cabanasRouter = express.Router();

// Todas las rutas requieren autenticación, excepto la de desarrollo
cabanasRouter.use(authenticate);

// Rutas principales de cabañas
cabanasRouter.route('/')
  .get(cabanasController.getAll)     // GET /api/cabanas - Mis cabañas
  .post(cabanasController.create);   // POST /api/cabanas - Crear cabaña

cabanasRouter.route('/:id')
  .get(cabanasController.getOne)     // GET /api/cabanas/:id - Una cabaña
  .put(cabanasController.update)     // PUT /api/cabanas/:id - Actualizar
  .delete(cabanasController.remove); // DELETE /api/cabanas/:id - Desactivar

// Ruta de desarrollo para ver todas las cabañas (sin autenticación)
// Esta ruta debe estar antes del middleware de autenticación
const devRouter = express.Router();
devRouter.get('/cabanas/dev', cabanasController.getAllForDev);

// Exportamos ambos routers
module.exports = {
  cabanasRouter,
  devRouter
};