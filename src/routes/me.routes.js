const express = require('express');
const meController = require('../controllers/me.controller');
const authenticate = require('../middleware/auth.middleware');

const meRouter = express.Router();

// Todas las rutas requieren autenticación
meRouter.use(authenticate);

meRouter.route('/')
  .get(meController.getProfile)
  .put(meController.updateProfile);

module.exports = meRouter;