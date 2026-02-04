const ApiError = require('../utils/apiError');

const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(401, 'Autenticación requerida'));
    }

    if (!allowedRoles.includes(req.user.rol)) {
      return next(new ApiError(403, 
        `Acceso denegado. Rol requerido: ${allowedRoles.join(', ')}`
      ));
    }

    next();
  };
};

module.exports = authorize;