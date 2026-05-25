// src/routes/index.js
const express = require('express');

const router = express.Router();


// 1. Importar los enrutadores individuales
const contentRoutes = require('./contentRoutes');
// const projectRoutes = require('./projectRoutes'); // Preparado para el futuro

// 2. Conectar las rutas a sus respectivos endpoints
router.use('/content', contentRoutes);
// router.use('/projects', projectRoutes); // Preparado para el futuro


module.exports = router;