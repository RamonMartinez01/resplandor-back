const ApiError = require('../utils/apiError');

const errorConverter = (err, req, res, next) => {
  let error = err;

  if (!(error instanceof ApiError)) {
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Error interno del servidor';
    error = new ApiError(statusCode, message, false, err.stack);
  }

  next(error);
};

const errorHandler = (err, req, res, next) => {
  const { statusCode, message, status } = err;

  res.locals.errorMessage = err.message;

  const response = {
    status,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  };

  if (process.env.NODE_ENV === 'development') {
    console.error(err);
  }

  res.status(statusCode || 500).json(response);
};

module.exports = { errorConverter, errorHandler };