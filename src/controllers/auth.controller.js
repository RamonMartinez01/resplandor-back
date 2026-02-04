const AuthService = require('../services/auth.service');

const authController = {
  // Registro de usuario
  async register(req, res, next) {
    try {
      const { email, password, nombre_completo } = req.body;

      if (!email || !password || !nombre_completo) {
        return res.status(400).json({
          success: false,
          message: 'Todos los campos son requeridos: email, password, nombre_completo'
        });
      }

      const result = await AuthService.register({
        email,
        password,
        nombre_completo
      });

      res.status(201).json({
        success: true,
        message: 'Usuario registrado exitosamente',
        data: result
      });
    } catch (error) {
      next(error);
    }
  },

  // Login de usuario
  async login(req, res, next) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email y contraseña son requeridos'
        });
      }

      const result = await AuthService.login(email, password);

      res.status(200).json({
        success: true,
        message: 'Login exitoso',
        data: result
      });
    } catch (error) {
      next(error);
    }
  },

  // Obtener todos los usuarios (solo para desarrollo)
  async getAllUsers(req, res, next) {
    try {
      // Solo en desarrollo
      if (process.env.NODE_ENV !== 'development') {
        return res.status(403).json({
          success: false,
          message: 'Solo disponible en entorno de desarrollo'
        });
      }

      const Usuario = require('../models/usuario');
      const usuarios = await Usuario.findAll();

      res.status(200).json({
        success: true,
        data: usuarios
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = authController;