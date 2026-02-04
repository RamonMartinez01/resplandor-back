const { Reservacion, Cabana, sequelize } = require('../models');
const ApiError = require('../utils/apiError');

const reservacionCabanasController = {
  // Agregar una cabaña a una reservación
  async addCabana(req, res, next) {
    const transaction = await sequelize.transaction();
    try {
      const { reservacion_id, cabana_id } = req.body;

      // Verificar que existan tanto la reservación como la cabaña
      const reservacion = await Reservacion.findByPk(reservacion_id, { transaction });
      const cabana = await Cabana.findByPk(cabana_id, { transaction });

      if (!reservacion) {
        throw new ApiError(404, 'Reservación no encontrada');
      }

      if (!cabana) {
        throw new ApiError(404, 'Cabaña no encontrada');
      }

      // Verificar si la cabaña ya está asociada a la reservación
      const existing = await sequelize.query(
        `SELECT * FROM reservacion_cabanas WHERE reservacion_id = ? AND cabana_id = ?`,
        {
          replacements: [reservacion_id, cabana_id],
          type: sequelize.QueryTypes.SELECT,
          transaction
        }
      );

      if (existing.length > 0) {
        throw new ApiError(400, 'La cabaña ya está asociada a esta reservación');
      }

      // Insertar en la tabla intermedia
      await sequelize.query(
        `INSERT INTO reservacion_cabanas (reservacion_id, cabana_id) VALUES (?, ?)`,
        {
          replacements: [reservacion_id, cabana_id],
          transaction
        }
      );

      await transaction.commit();

      // Obtener la reservación con sus cabañas actualizadas
      const reservacionActualizada = await Reservacion.findByPk(reservacion_id, {
        include: [{
          model: Cabana,
          as: 'cabanas',
          through: { attributes: [] } // No incluir atributos de la tabla intermedia
        }]
      });

      res.status(201).json({
        success: true,
        message: 'Cabaña agregada a la reservación exitosamente',
        data: reservacionActualizada
      });
    } catch (error) {
      await transaction.rollback();
      next(error);
    }
  },

  // Remover una cabaña de una reservación
  async removeCabana(req, res, next) {
    const transaction = await sequelize.transaction();
    try {
      const { reservacion_id, cabana_id } = req.body;

      // Verificar que exista la asociación
      const existing = await sequelize.query(
        `SELECT * FROM reservacion_cabanas WHERE reservacion_id = ? AND cabana_id = ?`,
        {
          replacements: [reservacion_id, cabana_id],
          type: sequelize.QueryTypes.SELECT,
          transaction
        }
      );

      if (existing.length === 0) {
        throw new ApiError(404, 'La cabaña no está asociada a esta reservación');
      }

      // Eliminar de la tabla intermedia
      await sequelize.query(
        `DELETE FROM reservacion_cabanas WHERE reservacion_id = ? AND cabana_id = ?`,
        {
          replacements: [reservacion_id, cabana_id],
          transaction
        }
      );

      await transaction.commit();

      res.status(200).json({
        success: true,
        message: 'Cabaña removida de la reservación exitosamente'
      });
    } catch (error) {
      await transaction.rollback();
      next(error);
    }
  },

  // Obtener todas las cabañas de una reservación
  async getCabanasByReservacion(req, res, next) {
    try {
      const { reservacion_id } = req.params;

      const reservacion = await Reservacion.findByPk(reservacion_id, {
        include: [{
          model: Cabana,
          as: 'cabanas',
          through: { attributes: [] }
        }]
      });

      if (!reservacion) {
        throw new ApiError(404, 'Reservación no encontrada');
      }

      res.status(200).json({
        success: true,
        data: reservacion.cabanas,
        count: reservacion.cabanas.length
      });
    } catch (error) {
      next(error);
    }
  },

  // Obtener todas las reservaciones de una cabaña
  async getReservacionesByCabana(req, res, next) {
    try {
      const { cabana_id } = req.params;

      const cabana = await Cabana.findByPk(cabana_id, {
        include: [{
          model: Reservacion,
          as: 'reservaciones',
          through: { attributes: [] },
          include: [{
            model: sequelize.models.Huesped,
            as: 'huesped',
            attributes: ['id', 'nombre', 'email']
          }]
        }]
      });

      if (!cabana) {
        throw new ApiError(404, 'Cabaña no encontrada');
      }

      res.status(200).json({
        success: true,
        data: cabana.reservaciones,
        count: cabana.reservaciones.length
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = reservacionCabanasController;