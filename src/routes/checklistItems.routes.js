// ROOT-backend/src/routes/checklistItems.routes.js
const express = require('express');
const checklistItemsController = require('../controllers/checklistItems.controller');
const authenticate = require('../middleware/auth.middleware');

const checklistItemsRouter = express.Router();

// Todas las rutas requieren autenticación
checklistItemsRouter.use(authenticate);

// Rutas principales
checklistItemsRouter.route('/')
  .get(checklistItemsController.getAll)      // GET /api-resplandor/checklistitems
  .post(checklistItemsController.create);    // POST /api-resplandor/checklistitems

// Rutas específicas
checklistItemsRouter.get('/pendientes', checklistItemsController.getPendientesByUsuario);
checklistItemsRouter.get('/criticos-proximos', checklistItemsController.getCriticosProximos);
checklistItemsRouter.get('/estadisticas', checklistItemsController.getEstadisticas);

// Rutas para reordenar y clonar
checklistItemsRouter.put('/reordenar/:checklist_id', checklistItemsController.reordenar);
checklistItemsRouter.post('/clonar-default/:checklist_id', checklistItemsController.clonarItemsPorDefecto);

// Rutas por ID
checklistItemsRouter.route('/:id')
  .get(checklistItemsController.getOne)       // GET /api-resplandor/checklistitems/:id
  .put(checklistItemsController.update)       // PUT /api-resplandor/checklistitems/:id
  .delete(checklistItemsController.remove);   // DELETE /api-resplandor/checklistitems/:id

// Ruta para toggle de completado
checklistItemsRouter.put('/:id/toggle-complete', checklistItemsController.toggleComplete);

module.exports = checklistItemsRouter;