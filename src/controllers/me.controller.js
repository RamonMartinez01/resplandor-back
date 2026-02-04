const meController = {
    // Obtener perfil del usuario autenticado
    async getProfile(req, res, next) {
      try {
        res.status(200).json({
          success: true,
          data: req.user
        });
      } catch (error) {
        next(error);
      }
    },
  
    // Actualizar perfil
    async updateProfile(req, res, next) {
      try {
        // Por ahora solo un mensaje
        res.status(200).json({
          success: true,
          message: 'Perfil actualizado (funcionalidad en construcción)',
          data: req.user
        });
      } catch (error) {
        next(error);
      }
    }
  };
  
  module.exports = meController;