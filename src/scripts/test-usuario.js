require('dotenv').config();
const path = require('path');

// Ajustar la ruta: subir un nivel desde scripts para llegar a src, luego a config/database
const { sequelize } = require('../config/database');
const Usuario = require('../models/usuario');

async function testModel() {
  try {
    // Sincronizar solo este modelo (para pruebas)
    await sequelize.sync({ alter: true });
    console.log('✅ Modelo sincronizado con la base de datos');

    // Crear un usuario de prueba
    const usuarioData = {
      email: 'test@resplandor.com',
      password_hash: 'password123', // Se encriptará automáticamente
      nombre_completo: 'Usuario de Prueba',
      rol: 'admin'
    };

    // Crear usuario
    const usuario = await Usuario.create(usuarioData);
    console.log('✅ Usuario creado:', usuario.toJSON());

    // Buscar usuario por email (sin password_hash por default scope)
    const usuarioEncontrado = await Usuario.findOne({ where: { email: 'test@resplandor.com' } });
    console.log('✅ Usuario encontrado (sin password):', usuarioEncontrado.toJSON());

    // Buscar usuario con password (usando scope)
    const usuarioConPassword = await Usuario.scope('conPassword').findOne({ 
      where: { email: 'test@resplandor.com' } 
    });
    console.log('✅ Usuario con password (solo para debug):', {
      id: usuarioConPassword.id,
      email: usuarioConPassword.email,
      password_hash_length: usuarioConPassword.password_hash?.length
    });

    // Validar contraseña
    const esValida = await usuarioConPassword.validarPassword('password123');
    console.log('✅ Contraseña válida?:', esValida);

    const esInvalida = await usuarioConPassword.validarPassword('wrongpassword');
    console.log('✅ Contraseña inválida?:', esInvalida);

    // Actualizar usuario
    await usuarioConPassword.update({ nombre_completo: 'Usuario Actualizado' });
    console.log('✅ Usuario actualizado');

    // Usar scopes
    const usuariosActivos = await Usuario.scope('activos').findAll();
    console.log(`✅ Usuarios activos: ${usuariosActivos.length}`);

    const usuariosAdmin = await Usuario.scope({ method: ['porRol', 'admin'] }).findAll();
    console.log(`✅ Usuarios admin: ${usuariosAdmin.length}`);

    // Limpiar: eliminar usuario de prueba
    await usuarioConPassword.destroy();
    console.log('✅ Usuario de prueba eliminado');

  } catch (error) {
    console.error('❌ Error en prueba:', error.message);
    console.error(error.stack);
  } finally {
    await sequelize.close();
    console.log('✅ Conexión cerrada');
  }
}

// Ejecutar prueba
if (require.main === module) {
  testModel();
}

module.exports = testModel;