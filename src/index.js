/**
 * Punto de entrada principal del servidor (entrypoint)
 * Responsable de:
 * 1.- Conectar a la base de datos
 * 2.- Iniciar el servidor Express
 * 3.- Configurar graceful shutdown
 */

const app = require('./app');
const db = require('./models'); 
const { testConnection } = require('./config/database');
require('dotenv').config();

// ===================================================================
// CONFIGURACIÓN DEL SERVIDOR
// ===================================================================

const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || '0.0.0.0';

// ===================================================================
// FUNCIÓN PARA INICIAR EL SERVIDOR
// ===================================================================

const startServer = async () => {
  try {
    console.log('Iniciando servidor Resplandor Backend...');

    // 1. VERIFICAR CONEXIÓN A LA BASE DE DATOS
    console.log('Verificando conexión a la base de datos...');
    const isDbConnected = await testConnection();

    if (!isDbConnected) {
      console.error('No se pudo conectar a la base de datos. Saliendo...');
      process.exit(1);
    }

    console.log('Base de datos conectada exitosamente.');

    // 2. SINCRONIZAR MODELOS (solo en desarrollo)
    // Por ahora no tenemos modelos, así que comentamos esta parte
    // if (process.env.NODE_ENV === 'development') {
    //   console.log('Sincronizando modelos (solo desarrollo)...');
    //   await sequelize.sync({ alter: false });
    //   console.log('Modelos sincronizados.');
    // }

    // 3. INICIAR SERVIDOR HTTP
    const server = app.listen(PORT, HOST, () => {
      console.log(`Servidor Express iniciado`);
      console.log(`Entorno: ${process.env.NODE_ENV || 'development'}`);
      console.log(`URL: http://${HOST}:${PORT}`);
      console.log(`Puerto: ${PORT}`);
      console.log(`Health check: http://${HOST}:${PORT}/health`);
      console.log(`Base de datos: ${process.env.DB_DATABASE || 'resplandor01_db'}`);

      // Solo mostrar en desarrollo
      if (process.env.NODE_ENV === 'development') {
        console.log('\nEndpoints disponibles:');
        console.log(`Bienvenida: GET /`);
        console.log(`Health: GET /health`);
        console.log(`API Base: GET /api-resplandor`);
      }
    });

    // ============================================================================
    // GRACEFUL SHUTDOWN - Manejo elegante del cierre
    // ============================================================================

    const gracefulShutdown = async (signal) => {
      console.log(`\n${signal} recibido. Iniciando shutdown elegante...`);

      // 1. Dejar de aceptar nuevas conexiones
      server.close(async () => {
        console.log('✅ Servidor HTTP cerrado.');

        // 2. Cerrar conexión a la base de datos
        try {
          await sequelize.close();
          console.log('✅ Conexión a base de datos cerrada.');
        } catch (dbError) {
          console.error('❌ Error cerrando conexión a BD:', dbError.message);
        }

        // 3. Salir del proceso
        console.log('👋 Proceso terminado exitosamente.');
        process.exit(0);
      });

      // Timeout forzado si el cierre tarda demasiado
      setTimeout(() => {
        console.error('❌ Timeout de graceful shutdown. Forzando salida...');
        process.exit(1);
      }, 10000);
    };

    // Manejar señales de terminación
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

    // Manejar errores no capturados
    process.on('unhandledRejection', (reason, promise) => {
      console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    });

    process.on('uncaughtException', (error) => {
      console.error('❌ Uncaught Exception:', error);
      gracefulShutdown('UNCAUGHT_EXCEPTION');
    });

  } catch (error) {
    console.error('❌ Error crítico al iniciar el servidor:', error);
    process.exit(1);
  }
};

// ============================================================================
// EJECUCIÓN PRINCIPAL
// ============================================================================

// Solo ejecutar si este archivo es el punto de entrada principal
if (require.main === module) {
  startServer();
} else {
  // Para testing, exportamos startServer
  module.exports = startServer;
}

// Exportar la app para testing
module.exports.app = app;