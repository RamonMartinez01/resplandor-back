require('dotenv').config();
const axios = require('axios');

const API_URL = 'http://localhost:5000/api-resplandor';

async function testAuth() {
  try {
    console.log('🔐 Probando sistema de autenticación...\n');

    // 1. Registrar un usuario
    console.log('1. Registrando usuario...');
    const registerData = {
      email: 'admin@resplandor.com',
      password: 'admin123',
      nombre_completo: 'Administrador Principal'
    };

    const registerResponse = await axios.post(`${API_URL}/auth/register`, registerData);
    console.log('✅ Registro exitoso:', registerResponse.data.message);
    console.log('   Token recibido:', registerResponse.data.data.token.substring(0, 20) + '...');

    const token = registerResponse.data.data.token;

    // 2. Login con el mismo usuario
    console.log('\n2. Haciendo login...');
    const loginData = {
      email: 'admin@resplandor.com',
      password: 'admin123'
    };

    const loginResponse = await axios.post(`${API_URL}/auth/login`, loginData);
    console.log('✅ Login exitoso:', loginResponse.data.message);

    // 3. Obtener perfil (con token)
    console.log('\n3. Obteniendo perfil...');
    const profileResponse = await axios.get(`${API_URL}/me`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    console.log('✅ Perfil obtenido:', {
      email: profileResponse.data.data.email,
      nombre: profileResponse.data.data.nombre_completo,
      rol: profileResponse.data.data.rol
    });

    // 4. Listar usuarios (solo desarrollo)
    console.log('\n4. Listando usuarios (dev endpoint)...');
    try {
      const usersResponse = await axios.get(`${API_URL}/auth/usuarios-dev`);
      console.log(`✅ Usuarios encontrados: ${usersResponse.data.data.length}`);
    } catch (error) {
      console.log('⚠️  Endpoint dev no disponible (quizás no estás en desarrollo)');
    }

    console.log('\n🎉 ¡Todas las pruebas pasaron!');

  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

// Instalar axios si no lo tienes: npm install axios
testAuth();