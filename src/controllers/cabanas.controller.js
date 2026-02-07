const { Cabana } = require('../models');
const ApiError = require('../utils/apiError');

const cabanasController = {
  // Obtener todas las cabañas (son globales, no por usuario)
  async getAll(req, res, next) {
    try {
      const cabanas = await Cabana.findAll({
        order: [['nombre', 'ASC']]
      });

      res.status(200).json({
        success: true,
        count: cabanas.length,
        data: cabanas,
        
      });
    } catch (error) {
      next(error);
    }
  },

  // Obtener una cabaña específica
  async getOne(req, res, next) {
    try {
      const { id } = req.params;
      const cabana = await Cabana.findByPk(id);

      if (!cabana) {
        throw new ApiError(404, 'Cabaña no encontrada');
      }

      res.status(200).json({
        success: true,
        data: cabana
      });
    } catch (error) {
      next(error);
    }
  },

  // Crear una nueva cabaña (sin usuario_id)
  async create(req, res, next) {
    try {
      const { tipo, nombre, descripcion, capacidad, precio_base } = req.body;

      const cabana = await Cabana.create({
        tipo,
        nombre,
        descripcion,
        capacidad,
        precio_base
        // NOTA: ya no incluimos usuario_id
      });

      res.status(201).json({
        success: true,
        message: 'Cabaña creada exitosamente',
        data: cabana
      });
    } catch (error) {
      next(error);
    }
  },

  // Actualizar una cabaña
  async update(req, res, next) {
    try {
      const { id } = req.params;
      const updates = req.body;

      const cabana = await Cabana.findByPk(id);

      if (!cabana) {
        throw new ApiError(404, 'Cabaña no encontrada');
      }

      await cabana.update(updates);

      res.status(200).json({
        success: true,
        message: 'Cabaña actualizada exitosamente',
        data: cabana
      });
    } catch (error) {
      next(error);
    }
  },

  // Eliminar una cabaña (soft delete)
  async remove(req, res, next) {
    try {
      const { id } = req.params;

      const cabana = await Cabana.findByPk(id);

      if (!cabana) {
        throw new ApiError(404, 'Cabaña no encontrada');
      }

      // Marcamos como inactiva en lugar de borrar
      await cabana.update({ activa: false });

      res.status(200).json({
        success: true,
        message: 'Cabaña desactivada exitosamente'
      });
    } catch (error) {
      next(error);
    }
  },

  // Obtener todas las cabañas (solo para desarrollo) - actualizado
  async getAllForDev(req, res, next) {
    try {
      // Solo permitir en entorno de desarrollo
      if (process.env.NODE_ENV !== 'development') {
        throw new ApiError(403, 'Este endpoint solo está disponible en entorno de desarrollo');
      }

      const cabanas = await Cabana.findAll({
        order: [['nombre', 'ASC']]
      });

      res.status(200).json({
        success: true,
        message: '✅ Endpoint de desarrollo - Todas las cabañas',
        count: cabanas.length,
        data: cabanas,
        
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = cabanasController;