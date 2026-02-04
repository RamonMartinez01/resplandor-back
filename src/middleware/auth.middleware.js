const jwt = require('jsonwebtoken');
const Usuario = require('../models/usuario');
const ApiError = require('../utils/apiError');

const authenticate = async (req, res, next) => {
  try {
    // 1. Extraer token
    let token = null;
    
    // De headers
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }
    
    // De cookies
    if (!token && req.cookies && req.cookies.auth_token) {
      token = req.cookies.auth_token;
    }
    
    if (!token) {
      throw new ApiError(401, 'Token de autenticación requerido');
    }

    // 2. Verificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 3. Buscar usuario
    const user = await Usuario.findByPk(decoded.sub);
    
    if (!user) {
      throw new ApiError(401, 'Usuario no encontrado');
    }
    
    if (!user.activo) {
      throw new ApiError(401, 'Usuario desactivado');
    }

    // 4. Adjuntar usuario a la request
    req.user = user;
    req.userId = user.id;
    req.userRol = user.rol;
    
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return next(new ApiError(401, 'Token inválido'));
    }
    if (error instanceof jwt.TokenExpiredError) {
      return next(new ApiError(401, 'Token expirado'));
    }
    next(error);
  }
};

module.exports = authenticate;