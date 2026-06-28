// src/middlewares/requireApiKey.js
const ApiError = require('../utils/apiError');
require('dotenv').config();

const requireApiKey = (req, res, next) => {
    // 1. Buscamos el header personalizado. Usualmente se usa 'x-api-key'
    const clientApiKey = req.headers['x-api-key'];

    console.log("🗝️ Header recibido:", clientApiKey);
    console.log("🔐 Variable de entorno (Node):", process.env.ADMIN_API_KEY);
    
    // 2. Verificamos que el header exista
    if (!clientApiKey) {
        return next(new ApiError(401, 'Acceso denegado: API Key no proporcionada.'));
    }

    // 3. Comparamos contra nuestra variable de entorno segura
    if (clientApiKey !== process.env.ADMIN_API_KEY) {
        return next(new ApiError(401, 'Acceso denegado: API Key inválida.'));
    }

    // 4. Si todo está correcto, permitimos que la petición continúe al controlador
    next();
};

module.exports = requireApiKey;