const express = require('express');
const reservacionCabanasController = require('../controllers/reservacionCabanas.controller');
const authenticate = require('../middleware/auth.middleware');

const reservacionCabanasRouter = express.Router();

// Todas las rutas requieren autenticación
reservacionCabanasRouter.use(authenticate);

// Agregar y remover cabañas de reservaciones
reservacionCabanasRouter.post('/agregar', reservacionCabanasController.addCabana);
reservacionCabanasRouter.post('/remover', reservacionCabanasController.removeCabana);

// Obtener relaciones
reservacionCabanasRouter.get('/reservacion/:reservacion_id', reservacionCabanasController.getCabanasByReservacion);
reservacionCabanasRouter.get('/cabana/:cabana_id', reservacionCabanasController.getReservacionesByCabana);

module.exports = reservacionCabanasRouter;