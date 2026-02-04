const { Huesped } = require('../models');
const ApiError = require('../utils/apiError');

const huespedesController = {
  // Obtener todos los huéspedes (todos los usuarios pueden ver todos)
  async getAll(req, res, next) {
    try {
      const huespedes = await Huesped.findAll({
        order: [['nombre', 'ASC']]
      });

      res.status(200).json({
        success: true,
        data: huespedes,
        count: huespedes.length
      });
    } catch (error) {
      next(error);
    }
  },

  // Obtener un huésped específico
  async getOne(req, res, next) {
    try {
      const { id } = req.params;
      const huesped = await Huesped.findByPk(id);

      if (!huesped) {
        throw new ApiError(404, 'Huésped no encontrado');
      }

      res.status(200).json({
        success: true,
        data: huesped
      });
    } catch (error) {
      next(error);
    }
  },

  // Crear un nuevo huésped
  async create(req, res, next) {
    try {
      const { 
        nombre, 
        automovil_uno, 
        automovil_dos, 
        automovil_tres, 
        email, 
        telefono, 
        notas 
      } = req.body;

      const huesped = await Huesped.create({
        nombre,
        automovil_uno: automovil_uno || '',
        automovil_dos: automovil_dos || '',
        automovil_tres: automovil_tres || '',
        email,
        telefono,
        notas,
        usuario_id: req.user.id
      });

      res.status(201).json({
        success: true,
        message: 'Huésped creado exitosamente',
        data: huesped
      });
    } catch (error) {
      next(error);
    }
  },

  // Actualizar un huésped
  async update(req, res, next) {
    try {
      const { id } = req.params;
      const updates = req.body;

      const huesped = await Huesped.findByPk(id);

      if (!huesped) {
        throw new ApiError(404, 'Huésped no encontrado');
      }

      await huesped.update(updates);

      res.status(200).json({
        success: true,
        message: 'Huésped actualizado exitosamente',
        data: huesped
      });
    } catch (error) {
      next(error);
    }
  },

  // Eliminar un huésped
  async remove(req, res, next) {
    try {
      const { id } = req.params;

      const huesped = await Huesped.findByPk(id);

      if (!huesped) {
        throw new ApiError(404, 'Huésped no encontrado');
      }

      await huesped.destroy();

      res.status(200).json({
        success: true,
        message: 'Huésped eliminado exitosamente'
      });
    } catch (error) {
      next(error);
    }
  },

  // Búsqueda de huéspedes
  async search(req, res, next) {
    try {
      const { query } = req.query;

      if (!query || query.trim() === '') {
        return res.status(400).json({
          success: false,
          message: 'Término de búsqueda requerido'
        });
      }

      const Op = require('sequelize').Op;
      const huespedes = await Huesped.findAll({
        where: {
          [Op.or]: [
            { nombre: { [Op.iLike]: `%${query}%` } },
            { email: { [Op.iLike]: `%${query}%` } },
            { telefono: { [Op.iLike]: `%${query}%` } },
            { notas: { [Op.iLike]: `%${query}%` } }
          ]
        },
        order: [['nombre', 'ASC']],
        limit: 50
      });

      res.status(200).json({
        success: true,
        data: huespedes,
        count: huespedes.length
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = huespedesController;