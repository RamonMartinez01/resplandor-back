const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Usuario = require('../models/usuario');
const ApiError = require('../utils/apiError');

class AuthService {
  /**
   * Registra un nuevo usuario.
   */
  static async register(userData) {
    const { email, password, nombre_completo } = userData;

    // Verificar si el email ya existe
    const existingUser = await Usuario.findOne({ where: { email } });
    if (existingUser) {
      throw new ApiError(400, 'El email ya está registrado.');
    }

    // Crear usuario (el modelo ya encripta la contraseña automáticamente)
    const user = await Usuario.create({
      email,
      password_hash: password, // Se encriptará en el hook del modelo
      nombre_completo,
      rol: 'admin', // Como acordamos, todos empiezan como admin
      activo: true
    });

    // Generar token JWT
    const token = this.generateToken(user);

    return { user: user.toJSON(), token };
  }

  /**
   * Autentica un usuario (login).
   */
  static async login(email, password) {
    // Buscar usuario con contraseña (usando el scope que definimos)
    const user = await Usuario.scope('conPassword').findOne({ 
      where: { email } 
    });

    if (!user) {
      throw new ApiError(401, 'Credenciales inválidas.');
    }

    if (!user.activo) {
      throw new ApiError(401, 'La cuenta está desactivada.');
    }

    // Comparar contraseñas usando el método del modelo
    const passwordMatch = await user.validarPassword(password);
    if (!passwordMatch) {
      throw new ApiError(401, 'Credenciales inválidas.');
    }

    // Generar token JWT
    const token = this.generateToken(user);

    // Devolver usuario sin password_hash
    const userResponse = user.toJSON();

    return { user: userResponse, token };
  }

  /**
   * Genera un token JWT.
   */
  static generateToken(user) {
    const payload = {
      sub: user.id,
      email: user.email,
      rol: user.rol,
      nombre: user.nombre_completo
    };

    return jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '24h',
      issuer: 'resplandor-api'
    });
  }

  /**
   * Verifica un token JWT.
   */
  static verifyToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new ApiError(401, 'Token expirado.');
      }
      throw new ApiError(401, 'Token inválido.');
    }
  }
}

module.exports = AuthService;