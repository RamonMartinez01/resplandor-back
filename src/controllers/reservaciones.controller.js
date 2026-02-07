const ApiError = require('../utils/apiError');
const checklistService = require('../services/checklistService');
const checklistItemService = require('../services/checklistItemService');
const { Reservacion, Huesped, Usuario, Cabana, Checklist, ChecklistItem, sequelize } = require('../models');
const { Op } = require('sequelize');

const reservacionesController = {
  // Obtener todas las reservaciones
  async getAll(req, res, next) {
    try {
      const reservaciones = await Reservacion.findAll({
        include: [
          {
            model: Huesped,
            as: 'huesped',
            attributes: ['id', 'nombre', 'email', 'telefono']
          },
          {
            model: Cabana,
            as: 'cabanas',
            through: { attributes: [] },
            attributes: ['id', 'nombre', 'descripcion']
          },
          {
            model: Usuario,
            as: 'usuario',
            attributes: ['id', 'nombre_completo', 'email']
          }
        ],
        order: [['fecha_inicio', 'ASC']]
      });

      res.status(200).json({
        success: true,
        data: reservaciones,
        count: reservaciones.length
      });
    } catch (error) {
      next(error);
    }
  },

  // Obtener todas las reservaciones (solo para desarrollo)
  async getAllForDev(req, res, next) {
    try {
      if (process.env.NODE_ENV !== 'development') {
        throw new ApiError(403, 'Este endpoint solo está disponible en entorno de desarrollo');
      }

      const reservaciones = await Reservacion.findAll({
        include: [
          {
            model: Huesped,
            as: 'huesped',
            attributes: ['id', 'nombre', 'email', 'telefono']
          },
          {
            model: Cabana,
            as: 'cabanas',
            through: { attributes: [] },
            attributes: ['id', 'nombre', 'descripcion']
          },
          {
            model: Usuario,
            as: 'usuario',
            attributes: ['id', 'nombre_completo', 'email']
          },
          {
            model: Checklist,
            as: 'checklist',
            include: [{
              model: ChecklistItem,
              as: 'items'
            }]
          }
        ],
        order: [['fecha_inicio', 'ASC']]
      });

      res.status(200).json({
        success: true,
        message: '✅ Endpoint de desarrollo - Todas las reservaciones',
        count: reservaciones.length,
        data: reservaciones,
      });
    } catch (error) {
      next(error);
    }
  },

  // Obtener una reservación específica
  async getOne(req, res, next) {
    try {
      const { id } = req.params;
      const reservacion = await Reservacion.findByPk(id, {
        include: [
          {
            model: Huesped,
            as: 'huesped',
            attributes: ['id', 'nombre', 'email', 'telefono', 'automovil_uno', 'automovil_dos', 'automovil_tres', 'notas']
          },
          {
            model: Usuario,
            as: 'usuario',
            attributes: ['id', 'nombre_completo', 'email']
          },
          {
            model: Cabana,
            as: 'cabanas',
            through: { attributes: [] },
            attributes: ['id', 'nombre', 'descripcion']
          }
        ]
      });

      if (!reservacion) {
        throw new ApiError(404, 'Reservación no encontrada');
      }

      // Obtener el checklist usando el servicio
      const checklist = await checklistService.getChecklistByReservacionId(id);
      if (checklist) {
        reservacion.dataValues.checklist = checklist;
      }

      res.status(200).json({
        success: true,
        data: reservacion
      });
    } catch (error) {
      next(error);
    }
  },

  // =====================================================================
  // Crear una nueva reservación con checklist por defecto y cabañas
  // =====================================================================
  async create(req, res, next) { 
    let transaction;
    let hasCommitted = false;

    try {
      transaction = await sequelize.transaction();
      
      const { 
        huesped_id, 
        fecha_inicio, 
        fecha_fin, 
        estado_pago = 'pendiente',
        monto_total = 0,
        anticipo_pagado = null,
        vehiculo = 'No',
        notas = null,
        cabanas_ids = []
      } = req.body;
  
      // Verificar que el huésped exista
      const huesped = await Huesped.findByPk(huesped_id, { transaction });
      if (!huesped) {
        throw new ApiError(404, 'Huésped no encontrado');
      }
  
      // Verificar que las cabañas existan (si se proporcionaron)
      if (cabanas_ids && cabanas_ids.length > 0) {
        const cabanas = await Cabana.findAll({
          where: { id: cabanas_ids },
          transaction
        });
        
        if (cabanas.length !== cabanas_ids.length) {
          throw new ApiError(404, 'Una o más cabañas no encontradas');
        }
      }
  
      // Crear la reservación
      const reservacion = await Reservacion.create({
        huesped_id,
        fecha_inicio,
        fecha_fin,
        estado_pago,
        monto_total,
        anticipo_pagado,
        vehiculo,
        notas,
        usuario_id: req.user.id
      }, { transaction });
  
      // Asociar cabañas a la reservación (si se proporcionaron)
      if (cabanas_ids && cabanas_ids.length > 0) {
        await reservacion.setCabanas(cabanas_ids, { transaction });
      }
  
      // Crear el checklist usando el servicio
      const checklist = await checklistService.createChecklistForReservacion(
        reservacion.id,
        req.user.id,
        transaction
      );
  
      console.log('Checklist creado con id:', checklist.id); // LOG TEMPORAL
  
      // Crear los items por defecto usando el servicio
      await checklistItemService.clonarItemsPorDefecto(
        checklist.id,
        req.user.id,
        fecha_inicio,
        fecha_fin,
        transaction
      );
  
      await transaction.commit();
      hasCommitted = true;
  
      // ============================================
      // CONSULTAS POSTERIORES AL COMMIT
      // ============================================
      
      // Obtener la reservación con toda la información
      const reservacionCompleta = await Reservacion.findByPk(reservacion.id, {
        include: [
          {
            model: Huesped,
            as: 'huesped',
            attributes: ['id', 'nombre', 'email', 'telefono']
          },
          {
            model: Cabana,
            as: 'cabanas',
            through: { attributes: [] },
            attributes: ['id', 'nombre', 'descripcion'],
            required: false  // Esto convierte el INNER JOIN en LEFT JOIN
          }
        ]
      });

      if (!reservacionCompleta) {
        // Esto no debería pasar, pero por seguridad
        console.error('Error: La reservación no se pudo recuperar después de crearse');
        throw new ApiError(500, 'No se pudo recuperar la reservación creada');
      }
  
      // Obtener el checklist con items usando el método CORRECTO
      const checklistCompleto = await checklistService.getChecklistWithItemsByReservacionId(reservacion.id);
      console.log('Checklist obtenido:', checklistCompleto ? 'Sí' : 'No'); // LOG TEMPORAL
      
      if (checklistCompleto) {
        reservacionCompleta.dataValues.checklist = checklistCompleto;
      }
  
      res.status(201).json({
        success: true,
        message: 'Reservación creada exitosamente con checklist por defecto',
        data: reservacionCompleta
      });
  
    } catch (error) {
      // Solo hacer rollback si no se ha confirmado la transacción
      if (transaction && !hasCommitted) {
        try {
          await transaction.rollback();
        } catch (rollbackError) {
          console.error('Error al hacer rollback:', rollbackError.message);
          // Continuamos con el error original
        }
      }
      
      // Loguear el error para diagnóstico
      console.error('Error en creación de reservación:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      
      next(error);
    }
  },
  // =====================================================================




  // =====================================================================
  // Actualizar una reservación
  // =====================================================================
  async update(req, res, next) {
    try {
      const { id } = req.params;
      const updates = req.body;

      const reservacion = await Reservacion.findByPk(id);
      if (!reservacion) {
        throw new ApiError(404, 'Reservación no encontrada');
      }

      // Evitar que se actualice el usuario_id
      if (updates.usuario_id) {
        delete updates.usuario_id;
      }

      await reservacion.update(updates);

      res.status(200).json({
        success: true,
        message: 'Reservación actualizada exitosamente',
        data: reservacion
      });
    } catch (error) {
      next(error);
    }
  },

  // Eliminar una reservación
  async remove(req, res, next) {
    const transaction = await sequelize.transaction();
    try {
      const { id } = req.params;

      const reservacion = await Reservacion.findByPk(id, { transaction });
      if (!reservacion) {
        throw new ApiError(404, 'Reservación no encontrada');
      }

      // Obtener el checklist primero para eliminar los items (si existe)
      const checklist = await checklistService.getChecklistByReservacionId(id, transaction);
      if (checklist) {
        await checklistItemService.deleteAllItemsByChecklist(checklist.id, transaction);
        await checklistService.deleteChecklist(checklist.id, transaction);
      }

      // Eliminar asociaciones con cabañas primero
      await reservacion.setCabanas([], { transaction });

      // Finalmente eliminar la reservación
      await reservacion.destroy({ transaction });

      await transaction.commit();

      res.status(200).json({
        success: true,
        message: 'Reservación y checklist asociados eliminados exitosamente'
      });
    } catch (error) {
      await transaction.rollback();
      next(error);
    }
  },

  // Buscar reservaciones
  async search(req, res, next) {
    try {
      const { fecha_desde, fecha_hasta, huesped_id, estado_pago } = req.query;
      const where = {};

      if (fecha_desde && fecha_hasta) {
        where.fecha_inicio = {
          [Op.between]: [fecha_desde, fecha_hasta]
        };
      } else if (fecha_desde) {
        where.fecha_inicio = {
          [Op.gte]: fecha_desde
        };
      } else if (fecha_hasta) {
        where.fecha_fin = {
          [Op.lte]: fecha_hasta
        };
      }

      if (huesped_id) {
        where.huesped_id = huesped_id;
      }

      if (estado_pago) {
        where.estado_pago = estado_pago;
      }

      const reservaciones = await Reservacion.findAll({
        where,
        include: [
          {
            model: Huesped,
            as: 'huesped',
            attributes: ['id', 'nombre', 'email']
          }
        ],
        order: [['fecha_inicio', 'ASC']],
        limit: 100
      });

      res.status(200).json({
        success: true,
        data: reservaciones,
        count: reservaciones.length
      });
    } catch (error) {
      next(error);
    }
  },

  // Obtener reservaciones activas
  async getActivas(req, res, next) {
    try {
      const hoy = new Date().toISOString().split('T')[0];
      
      const reservaciones = await Reservacion.findAll({
        where: {
          fecha_fin: {
            [Op.gte]: hoy
          }
        },
        order: [['fecha_inicio', 'ASC']],
        include: [
          {
            model: Huesped,
            as: 'huesped',
            attributes: ['id', 'nombre', 'email', 'telefono']
          },
          {
            model: Cabana,
            as: 'cabanas',
            through: { attributes: [] },
            attributes: ['id', 'nombre']
          },
          {
            model: Usuario,
            as: 'usuario',
            attributes: ['id', 'nombre_completo', 'email']
          },
        ],
        
      });

      // Para cada reservación, obtener el checklist con items pendientes
      const reservacionesConChecklist = await Promise.all(
        reservaciones.map(async (reservacion) => {
          const checklist = await checklistService.getChecklistWithPendingItems(
            reservacion.id
          );
          
          const reservacionJSON = reservacion.toJSON();
          reservacionJSON.checklist = checklist;
          
          return reservacionJSON;
        })
      );

      res.status(200).json({
        success: true,
        count: reservacionesConChecklist.length,
        data: reservacionesConChecklist,        
      });
    } catch (error) {
      next(error);
    }
  },

  // Obtener estadísticas de reservaciones
  async getEstadisticas(req, res, next) {
    try {
      const hoy = new Date();
      const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
      const finMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);

      // Estadísticas básicas
      const totalReservaciones = await Reservacion.count();
      const reservacionesActivas = await Reservacion.count({
        where: {
          fecha_fin: { [Op.gte]: hoy }
        }
      });
      const reservacionesMes = await Reservacion.count({
        where: {
          fecha_inicio: { [Op.between]: [inicioMes, finMes] }
        }
      });

      // Reservaciones por estado de pago
      const porEstadoPago = await Reservacion.findAll({
        attributes: [
          'estado_pago',
          [sequelize.fn('COUNT', sequelize.col('id')), 'total']
        ],
        group: ['estado_pago']
      });

      // Reservaciones por mes (últimos 6 meses)
      const seisMesesAtras = new Date();
      seisMesesAtras.setMonth(seisMesesAtras.getMonth() - 6);

      const porMes = await Reservacion.findAll({
        attributes: [
          [sequelize.fn('DATE_TRUNC', 'month', sequelize.col('fecha_inicio')), 'mes'],
          [sequelize.fn('COUNT', sequelize.col('id')), 'total']
        ],
        where: {
          fecha_inicio: { [Op.gte]: seisMesesAtras }
        },
        group: [sequelize.fn('DATE_TRUNC', 'month', sequelize.col('fecha_inicio'))],
        order: [[sequelize.fn('DATE_TRUNC', 'month', sequelize.col('fecha_inicio')), 'DESC']]
      });

      res.status(200).json({
        success: true,
        data: {
          total: totalReservaciones,
          activas: reservacionesActivas,
          este_mes: reservacionesMes,
          por_estado_pago: porEstadoPago,
          por_mes: porMes
        }
      });
    } catch (error) {
      next(error);
    }
  },

  // Obtener próximas reservaciones (para dashboard)
  async getProximas(req, res, next) {
    try {
      const hoy = new Date();
      const en7Dias = new Date();
      en7Dias.setDate(hoy.getDate() + 7);

      const reservaciones = await Reservacion.findAll({
        where: {
          fecha_inicio: {
            [Op.between]: [hoy, en7Dias]
          }
        },
        include: [
          {
            model: Huesped,
            as: 'huesped',
            attributes: ['id', 'nombre', 'email', 'telefono']
          },
          {
            model: Cabana,
            as: 'cabanas',
            through: { attributes: [] },
            attributes: ['id', 'nombre']
          }
        ],
        order: [['fecha_inicio', 'ASC']],
        limit: 10
      });

      // Obtener checklists para las reservaciones próximas
      const reservacionesConChecklist = await Promise.all(
        reservaciones.map(async (reservacion) => {
          const checklist = await checklistService.getChecklistWithPendingItems(
            reservacion.id
          );
          
          const reservacionJSON = reservacion.toJSON();
          reservacionJSON.checklist = checklist;
          
          return reservacionJSON;
        })
      );

      res.status(200).json({
        success: true,
        data: reservacionesConChecklist,
        count: reservacionesConChecklist.length
      });
    } catch (error) {
      next(error);
    }
  },

  // Obtener checklist de una reservación específica
  async getChecklist(req, res, next) {
    try {
      const { id } = req.params;

      const reservacion = await Reservacion.findByPk(id);
      if (!reservacion) {
        throw new ApiError(404, 'Reservación no encontrada');
      }

      const checklist = await checklistService.getChecklistWithItemsByReservacionId(id);

      res.status(200).json({
        success: true,
        data: checklist
      });
    } catch (error) {
      next(error);
    }
  },

  // Agregar cabaña a una reservación
  async agregarCabana(req, res, next) {
    const transaction = await sequelize.transaction();
    try {
      const { id } = req.params;
      const { cabana_id } = req.body;

      const reservacion = await Reservacion.findByPk(id, { transaction });
      if (!reservacion) {
        throw new ApiError(404, 'Reservación no encontrada');
      }

      const cabana = await Cabana.findByPk(cabana_id, { transaction });
      if (!cabana) {
        throw new ApiError(404, 'Cabaña no encontrada');
      }

      await reservacion.addCabana(cabana, { transaction });
      await transaction.commit();

      res.status(200).json({
        success: true,
        message: 'Cabaña agregada a la reservación exitosamente'
      });
    } catch (error) {
      await transaction.rollback();
      next(error);
    }
  },

  // Remover cabaña de una reservación
  async removerCabana(req, res, next) {
    const transaction = await sequelize.transaction();
    try {
      const { id } = req.params;
      const { cabana_id } = req.body;

      const reservacion = await Reservacion.findByPk(id, { transaction });
      if (!reservacion) {
        throw new ApiError(404, 'Reservación no encontrada');
      }

      const cabana = await Cabana.findByPk(cabana_id, { transaction });
      if (!cabana) {
        throw new ApiError(404, 'Cabaña no encontrada');
      }

      await reservacion.removeCabana(cabana, { transaction });
      await transaction.commit();

      res.status(200).json({
        success: true,
        message: 'Cabaña removida de la reservación exitosamente'
      });
    } catch (error) {
      await transaction.rollback();
      next(error);
    }
  }
};

module.exports = reservacionesController;