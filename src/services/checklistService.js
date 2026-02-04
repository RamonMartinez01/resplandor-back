// ROOT-backend/src/services/checklistService.js
const { Checklist, ChecklistItem, Reservacion } = require('../models');
const ApiError = require('../utils/apiError');
const { Op } = require('sequelize');

class ChecklistService {
  /**
   * Obtener checklist por ID
   */
  static async getChecklistById(checklistId, transaction = null) {
    try {
      const options = {
        where: { id: checklistId }
      };
      
      if (transaction) {
        options.transaction = transaction;
      }
      
      return await Checklist.findOne(options);
    } catch (error) {
      throw new ApiError(500, `Error al obtener checklist: ${error.message}`);
    }
  }

  /**
   * Obtener checklist por ID de reservación
   */
  static async getChecklistByReservacionId(reservacionId, transaction = null) {
    try {
      const options = {
        where: { reservacion_id: reservacionId },
        include: [{
          model: ChecklistItem,
          as: 'items',
          order: [['orden', 'ASC']]
        }]
      };
      
      if (transaction) {
        options.transaction = transaction;
      }
      
      return await Checklist.findOne(options);
    } catch (error) {
      throw new ApiError(500, `Error al obtener checklist por reservación: ${error.message}`);
    }
  }

  /**
   * Obtener checklist con todos sus items
   */
  static async getChecklistWithItems(checklistId) {
    
    try {
      return await Checklist.findByPk(checklistId, {
        include: [{
          model: ChecklistItem,
          as: 'items',
          order: [['orden', 'ASC']]
        }]
      });
    } catch (error) {
      throw new ApiError(500, `Error al obtener checklist con items: ${error.message}`);
    }
  }

  /**
   * Obtener checklist con items pendientes de una reservación
   */
  static async getChecklistWithPendingItems(reservacionId) {
    try {
      const checklist = await Checklist.findOne({
        where: { reservacion_id: reservacionId },
        include: [{
          model: ChecklistItem,
          as: 'items',
          where: { completado: false },
          required: false,
          order: [['orden', 'ASC']]
        }]
      });
      
      if (!checklist) {
        return null;
      }
      
      return checklist;
    } catch (error) {
      throw new ApiError(500, `Error al obtener checklist con items pendientes: ${error.message}`);
    }
  }

  /**
   * Obtener checklist con items por ID de reservación
   */
  static async getChecklistWithItemsByReservacionId(reservacionId) {
    console.log('checklistService.getChecklistWithItemsByReservacionId - reservacionId:', reservacionId); // LOG TEMPORAL
    
    try {
      const result = await Checklist.findOne({
        where: { reservacion_id: reservacionId },
        include: [{
          model: ChecklistItem,
          as: 'items',
          order: [['orden', 'ASC']]
        }]
      });
      
      console.log('checklistService.getChecklistWithItemsByReservacionId - resultado:', result ? 'Encontrado' : 'No encontrado'); // LOG TEMPORAL
      
      if (result) {
        console.log('Número de items encontrados:', result.items ? result.items.length : 0); // LOG TEMPORAL
      }
      
      return result;
    } catch (error) {
      console.error('checklistService.getChecklistWithItemsByReservacionId - error:', error); // LOG TEMPORAL
      throw new ApiError(500, `Error al obtener checklist por reservación: ${error.message}`);
    }
  }

  /**
   * Crear checklist para una reservación
   */
  static async createChecklistForReservacion(reservacionId, usuarioId, transaction = null) {
    try {
      // Verificar que la reservación exista
      const reservacion = await Reservacion.findByPk(reservacionId, { transaction });
      if (!reservacion) {
        throw new ApiError(404, 'Reservación no encontrada');
      }
      
      // Verificar que no exista ya un checklist para esta reservación
      const existingChecklist = await Checklist.findOne({
        where: { reservacion_id: reservacionId },
        transaction
      });
      
      if (existingChecklist) {
        throw new ApiError(400, 'Ya existe un checklist para esta reservación');
      }
      
      const checklistData = {
        reservacion_id: reservacionId,
        usuario_id: usuarioId
      };
      
      const options = {};
      if (transaction) {
        options.transaction = transaction;
      }
      
      return await Checklist.create(checklistData, options);
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(500, `Error al crear checklist: ${error.message}`);
    }
  }

  /**
   * Eliminar un checklist
   */
  static async deleteChecklist(checklistId, transaction = null) {
    try {
      const checklist = await Checklist.findByPk(checklistId, { transaction });
      
      if (!checklist) {
        throw new ApiError(404, 'Checklist no encontrado');
      }
      
      const options = {};
      if (transaction) {
        options.transaction = transaction;
      }
      
      await checklist.destroy(options);
      
      return true;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(500, `Error al eliminar checklist: ${error.message}`);
    }
  }

  /**
   * Actualizar un checklist
   */
  static async updateChecklist(checklistId, updates, transaction = null) {
    try {
      const checklist = await Checklist.findByPk(checklistId, { transaction });
      
      if (!checklist) {
        throw new ApiError(404, 'Checklist no encontrado');
      }
      
      const options = {};
      if (transaction) {
        options.transaction = transaction;
      }
      
      await checklist.update(updates, options);
      
      return checklist;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(500, `Error al actualizar checklist: ${error.message}`);
    }
  }

  /**
   * Obtener todos los checklists
   */
  static async getAllChecklists(filters = {}) {
    try {
      const where = {};
      
      // Aplicar filtros
      if (filters.reservacion_id) {
        where.reservacion_id = filters.reservacion_id;
      }
      
      if (filters.usuario_id) {
        where.usuario_id = filters.usuario_id;
      }
      
      return await Checklist.findAll({
        where,
        include: [{
          model: ChecklistItem,
          as: 'items',
          order: [['orden', 'ASC']]
        }],
        order: [['createdAt', 'DESC']]
      });
    } catch (error) {
      throw new ApiError(500, `Error al obtener checklists: ${error.message}`);
    }
  }

  /**
   * Obtener checklists por usuario
   */
  static async getChecklistsByUsuario(usuarioId) {
    try {
      return await Checklist.findAll({
        where: { usuario_id: usuarioId },
        include: [
          {
            model: Reservacion,
            as: 'reservacion',
            include: [{
              model: 'Huesped',
              as: 'huesped',
              attributes: ['id', 'nombre', 'email']
            }]
          },
          {
            model: ChecklistItem,
            as: 'items',
            order: [['orden', 'ASC']]
          }
        ],
        order: [['createdAt', 'DESC']]
      });
    } catch (error) {
      throw new ApiError(500, `Error al obtener checklists por usuario: ${error.message}`);
    }
  }

  /**
   * Obtener checklists con items vencidos o próximos a vencer
   */
  static async getChecklistsConItemsProximos(dias = 3) {
    try {
      const hoy = new Date();
      const fechaLimite = new Date();
      fechaLimite.setDate(hoy.getDate() + dias);
      
      // Primero obtenemos los checklists que tienen items pendientes
      const checklists = await Checklist.findAll({
        include: [
          {
            model: Reservacion,
            as: 'reservacion',
            attributes: ['id', 'fecha_inicio', 'fecha_fin', 'estado_pago']
          },
          {
            model: ChecklistItem,
            as: 'items',
            where: {
              completado: false,
              // Items que tienen días relativos y están próximos
              [Op.or]: [
                { dias_relativo: null }, // Items inmediatos
                {
                  dias_relativo: {
                    [Op.ne]: null
                  }
                }
              ]
            },
            required: true,
            order: [['orden', 'ASC']]
          }
        ],
        order: [[Reservacion, 'fecha_inicio', 'ASC']]
      });
      
      // Filtrar items que están próximos según la fecha de la reservación
      const checklistsFiltrados = checklists.map(checklist => {
        const reservacion = checklist.reservacion;
        const itemsProximos = checklist.items.filter(item => {
          if (item.dias_relativo === null) {
            // Items inmediatos: siempre mostrar
            return true;
          }
          
          // Calcular fecha objetivo basado en días_relativo
          const fechaBase = new Date(reservacion.fecha_inicio);
          fechaBase.setDate(fechaBase.getDate() + item.dias_relativo);
          
          // Verificar si la fecha objetivo está dentro del rango
          return fechaBase >= hoy && fechaBase <= fechaLimite;
        });
        
        if (itemsProximos.length > 0) {
          const checklistJSON = checklist.toJSON();
          checklistJSON.items = itemsProximos;
          return checklistJSON;
        }
        
        return null;
      }).filter(checklist => checklist !== null);
      
      return checklistsFiltrados;
    } catch (error) {
      throw new ApiError(500, `Error al obtener checklists con items próximos: ${error.message}`);
    }
  }

  /**
   * Obtener estadísticas de checklists
   */
  static async getEstadisticasChecklists(usuarioId = null) {
    try {
      const where = {};
      if (usuarioId) {
        where.usuario_id = usuarioId;
      }
      
      const totalChecklists = await Checklist.count({ where });
      
      const checklistsConItems = await Checklist.count({
        where,
        include: [{
          model: ChecklistItem,
          as: 'items',
          required: true
        }]
      });
      
      const checklistsSinItems = totalChecklists - checklistsConItems;
      
      return {
        total: totalChecklists,
        con_items: checklistsConItems,
        sin_items: checklistsSinItems,
        porcentaje_con_items: totalChecklists > 0 ? (checklistsConItems / totalChecklists * 100).toFixed(2) : 0
      };
    } catch (error) {
      throw new ApiError(500, `Error al obtener estadísticas: ${error.message}`);
    }
  }

  /**
   * Verificar si existe checklist para una reservación
   */
  static async existeChecklistParaReservacion(reservacionId) {
    try {
      const count = await Checklist.count({
        where: { reservacion_id: reservacionId }
      });
      
      return count > 0;
    } catch (error) {
      throw new ApiError(500, `Error al verificar checklist: ${error.message}`);
    }
  }

  /**
   * Obtener checklist con relaciones completas
   */
  static async getChecklistCompleto(checklistId) {
    try {
      return await Checklist.findByPk(checklistId, {
        include: [
          {
            model: Reservacion,
            as: 'reservacion',
            include: [
              {
                model: 'Huesped',
                as: 'huesped',
                attributes: ['id', 'nombre', 'email', 'telefono']
              },
              {
                model: 'Cabana',
                as: 'cabanas',
                through: { attributes: [] },
                attributes: ['id', 'nombre']
              }
            ]
          },
          {
            model: ChecklistItem,
            as: 'items',
            order: [['orden', 'ASC']]
          }
        ]
      });
    } catch (error) {
      throw new ApiError(500, `Error al obtener checklist completo: ${error.message}`);
    }
  }
}

module.exports = ChecklistService;