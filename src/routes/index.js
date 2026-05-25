// src/routes/index.js
const express = require('express');

const router = express.Router();


// 1. Importar los enrutadores individuales
const contentRoutes = require('./contentRoutes');
const projectRoutes = require('./projectRoutes'); 

// 2. Conectar las rutas a sus respectivos endpoints
router.use('/content', contentRoutes);
router.use('/projects', projectRoutes); 


module.exports = router;