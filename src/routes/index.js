const express = require('express');
const authRoutes = require('./auth.routes');
const meRoutes = require('./me.routes');
const { cabanasRouter, devRouter } = require('./cabanas.routes');
const huespedesRouter = require('./huespedes.routes');
const { reservacionesRouter, devRouter: reservacionesDevRouter } = require('./reservaciones.routes');
const reservacionCabanasRouter = require('./reservacionCabanas.routes');
const checklistItemsRouter = require('./checklistItems.routes')

const router = express.Router();

// Rutas de autenticación
router.use('/auth', authRoutes);

// Ruta de desarrollo para ver todas las cabañas (sin autenticación)
if (process.env.NODE_ENV === 'development') {
  router.use(devRouter);
  router.use(reservacionesDevRouter);
}

// Rutas de perfil (protegidas)
router.use('/me', meRoutes);
router.use('/cabanas', cabanasRouter);
router.use('/huespedes', huespedesRouter);
router.use('/reservaciones', reservacionesRouter);
router.use('/reservacion-cabanas', reservacionCabanasRouter);
router.use('/checklistitems', checklistItemsRouter);


// Ruta base de API
// Ruta base de API
router.get('/', (req, res) => {
  res.json({
    message: 'API de Resplandor - Sistema de Gestión de Cabañas',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    endpoints: {
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
        dev_users: 'GET /api/auth/usuarios-dev (solo desarrollo)'
      },
      profile: {
        get: 'GET /api/me',
        update: 'PUT /api/me'
      },
      cabanas: {
        list: 'GET /api/cabanas',
        create: 'POST /api/cabanas',
        detail: 'GET /api/cabanas/:id',
        update: 'PUT /api/cabanas/:id',
        delete: 'DELETE /api/cabanas/:id',
        dev_all: 'GET /api/cabanas/dev (solo desarrollo)'
      },
      huespedes: {
        list: 'GET /api/huespedes',
        create: 'POST /api/huespedes',
        search: 'GET /api/huespedes/buscar?query=...',
        detail: 'GET /api/huespedes/:id',
        update: 'PUT /api/huespedes/:id',
        delete: 'DELETE /api/huespedes/:id'
      },
      reservaciones: {
        list: 'GET /api/reservaciones',
        create: 'POST /api/reservaciones',
        activas: 'GET /api/reservaciones/activas',
        search: 'GET /api/reservaciones/buscar?params',
        detail: 'GET /api/reservaciones/:id',
        update: 'PUT /api/reservaciones/:id',
        delete: 'DELETE /api/reservaciones/:id',
        dev_all: 'GET /api/reservaciones/dev (solo desarrollo)'
      },
      reservacion_cabanas: {
        agregar: 'POST /api/reservacion-cabanas/agregar',
        remover: 'POST /api/reservacion-cabanas/remover',
        por_reservacion: 'GET /api/reservacion-cabanas/reservacion/:id',
        por_cabana: 'GET /api/reservacion-cabanas/cabana/:id'
      }
    }
  });
});

module.exports = router;