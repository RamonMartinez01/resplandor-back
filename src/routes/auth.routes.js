const express = require('express');
const { register, login, getAllUsers } = require('../controllers/auth.controller');

const authRouter = express.Router();

// Rutas públicas
authRouter.post('/register', register);
authRouter.post('/login', login);

// Ruta para desarrollo (sin autenticación)
authRouter.get('/usuarios-dev', getAllUsers);

module.exports = authRouter;