// ROOT-backend/src/services/checklistItemService.js
const { ChecklistItem, Checklist, Reservacion, Usuario } = require('../models');
const ApiError = require('../utils/apiError');
const { Op } = require('sequelize');

class ChecklistItemService {
  /**
   * Obtener todos los items de checklist con filtros
   */
  static async getAllChecklistItems(filters = {}) {
    try {
      const where = {};
      
      // Aplicar filtros
      if (filters.checklist_id) {
        where.checklist_id = filters.checklist_id;
      }
      
      if (filters.completado !== undefined) {
        where.completado = filters.completado;
      }
      
      if (filters.importancia) {
        where.importancia = filters.importancia;
      }
      
      if (filters.dias_relativo !== undefined) {
        where.dias_relativo = filters.dias_relativo;
      }
      
      if (filters.es_default !== undefined) {
        where.es_default = filters.es_default;
      }
      
      if (filters.usuario_id) {
        where.usuario_id = filters.usuario_id;
      }

      return await ChecklistItem.findAll({
        where,
        include: [{
          model: Checklist,
          as: 'checklist',
          include: [{
            model: Reservacion,
            as: 'reservacion'
          }]
        }],
        order: [['orden', 'ASC']]
      });
    } catch (error) {
      throw new ApiError(500, `Error al obtener items de checklist: ${error.message}`);
    }
  }

  /**
   * Obtener un item por ID
   */
  static async getChecklistItemById(itemId) {
    try {
      return await ChecklistItem.findByPk(itemId, {
        include: [{
          model: Checklist,
          as: 'checklist',
          include: [{
            model: Reservacion,
            as: 'reservacion'
          }]
        }]
      });
    } catch (error) {
      throw new ApiError(500, `Error al obtener item de checklist: ${error.message}`);
    }
  }

  /**
   * Crear un nuevo item de checklist
   */
  static async createChecklistItem(itemData, transaction = null) {
    try {
      const options = {};
      if (transaction) {
        options.transaction = transaction;
      }

      // Si no se especifica orden, obtener el máximo orden actual y sumar 1
      if (!itemData.orden) {
        const maxOrder = await ChecklistItem.max('orden', {
          where: { checklist_id: itemData.checklist_id },
          ...options
        });
        itemData.orden = (maxOrder || 0) + 1;
      }

      return await ChecklistItem.create(itemData, options);
    } catch (error) {
      if (error.name === 'SequelizeValidationError') {
        const errors = error.errors.map(err => err.message);
        throw new ApiError(400, `Error de validación: ${errors.join(', ')}`);
      }
      throw new ApiError(500, `Error al crear item de checklist: ${error.message}`);
    }
  }

  /**
   * Actualizar un item de checklist
   */
  static async updateChecklistItem(itemId, updates, transaction = null) {
    try {
      const item = await ChecklistItem.findByPk(itemId);
      
      if (!item) {
        throw new ApiError(404, 'Item de checklist no encontrado');
      }

      const options = {};
      if (transaction) {
        options.transaction = transaction;
      }

      await item.update(updates, options);
      return item;
    } catch (error) {
      if (error.name === 'SequelizeValidationError') {
        const errors = error.errors.map(err => err.message);
        throw new ApiError(400, `Error de validación: ${errors.join(', ')}`);
      }
      throw new ApiError(500, `Error al actualizar item de checklist: ${error.message}`);
    }
  }

  /**
   * Eliminar un item de checklist
   */
  static async deleteChecklistItem(itemId, transaction = null) {
    try {
      const item = await ChecklistItem.findByPk(itemId);
      
      if (!item) {
        throw new ApiError(404, 'Item de checklist no encontrado');
      }

      const options = {};
      if (transaction) {
        options.transaction = transaction;
      }

      await item.destroy(options);
      return true;
    } catch (error) {
      throw new ApiError(500, `Error al eliminar item de checklist: ${error.message}`);
    }
  }

  /**
   * Eliminar todos los items de un checklist
   */
  static async deleteAllItemsByChecklist(checklistId, transaction = null) {
    try {
      const options = {
        where: { checklist_id: checklistId }
      };
      
      if (transaction) {
        options.transaction = transaction;
      }

      await ChecklistItem.destroy(options);
      return true;
    } catch (error) {
      throw new ApiError(500, `Error al eliminar items del checklist: ${error.message}`);
    }
  }

  /**
   * Alternar estado completado de un item
   */
  static async toggleChecklistItemCompletion(itemId) {
    try {
      const item = await ChecklistItem.findByPk(itemId);
      
      if (!item) {
        throw new ApiError(404, 'Item de checklist no encontrado');
      }

      item.completado = !item.completado;
      item.fecha_completado = item.completado ? new Date() : null;
      
      await item.save();
      return item;
    } catch (error) {
      throw new ApiError(500, `Error al alternar estado del item: ${error.message}`);
    }
  }

  /**
   * Obtener items pendientes por usuario
   */
  static async getPendientesByUsuario(userId) {
    try {
      return await ChecklistItem.findAll({
        where: {
          completado: false,
          usuario_id: userId
        },
        include: [{
          model: Checklist,
          as: 'checklist',
          include: [{
            model: Reservacion,
            as: 'reservacion',
            include: [{
              model: 'Huesped',
              as: 'huesped',
              attributes: ['nombre']
            }]
          }]
        }],
        order: [
          ['importancia', 'DESC'],
          ['orden', 'ASC']
        ]
      });
    } catch (error) {
      throw new ApiError(500, `Error al obtener items pendientes: ${error.message}`);
    }
  }

  /**
   * Obtener items críticos próximos a vencer
   */
  static async getCriticosProximos(dias = 3) {
    try {
      const hoy = new Date();
      const fechaLimite = new Date();
      fechaLimite.setDate(hoy.getDate() + dias);

      // Primero obtenemos todos los items críticos pendientes
      const itemsCriticos = await ChecklistItem.findAll({
        where: {
          completado: false,
          importancia: 'critico'
        },
        include: [{
          model: Checklist,
          as: 'checklist',
          required: true,
          include: [{
            model: Reservacion,
            as: 'reservacion',
            required: true
          }]
        }]
      });

      // Filtramos los items que están próximos según la fecha de la reservación
      const itemsProximos = itemsCriticos.filter(item => {
        const reservacion = item.checklist.reservacion;
        
        if (!item.dias_relativo) {
          // Items inmediatos: siempre mostrar
          return true;
        }

        // Calcular fecha objetivo basado en días_relativo
        const fechaInicio = new Date(reservacion.fecha_inicio);
        const fechaObjetivo = new Date(fechaInicio);
        fechaObjetivo.setDate(fechaInicio.getDate() + item.dias_relativo);

        // Verificar si la fecha objetivo está dentro del rango
        return fechaObjetivo >= hoy && fechaObjetivo <= fechaLimite;
      });

      return itemsProximos;
    } catch (error) {
      throw new ApiError(500, `Error al obtener items críticos próximos: ${error.message}`);
    }
  }

  /**
   * Reordenar items de un checklist
   */
  static async reordenarItems(checklistId, nuevosOrdenes) {
    const transaction = await ChecklistItem.sequelize.transaction();
    
    try {
      // Validar que todos los items pertenezcan al checklist
      const itemsIds = nuevosOrdenes.map(item => item.id);
      const itemsCount = await ChecklistItem.count({
        where: {
          id: itemsIds,
          checklist_id: checklistId
        },
        transaction
      });

      if (itemsCount !== itemsIds.length) {
        throw new ApiError(400, 'Uno o más items no pertenecen al checklist');
      }

      // Actualizar el orden de cada item
      const updates = nuevosOrdenes.map(item => 
        ChecklistItem.update(
          { orden: item.orden },
          { 
            where: { id: item.id },
            transaction
          }
        )
      );

      await Promise.all(updates);
      await transaction.commit();

      // Devolver los items actualizados en el nuevo orden
      return await ChecklistItem.findAll({
        where: { checklist_id: checklistId },
        order: [['orden', 'ASC']]
      });
    } catch (error) {
      await transaction.rollback();
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError(500, `Error al reordenar items: ${error.message}`);
    }
  }

  /**
   * Clonar items por defecto para un checklist
   */
  static async clonarItemsPorDefecto(checklistId, usuarioId, fechaInicio, fechaFin, transaction = null) {
    console.log('clonarItemsPorDefecto - checklistId:', checklistId, 'usuarioId:', usuarioId); // LOG TEMPORAL
  
    try {
      const itemsPorDefecto = [
        {
          nombre: 'Ruta',
          descripcion: 'Confirmar ruta de acceso a la cabaña',
          importancia: 'critico',
          es_default: true,
          dias_relativo: null,
          notificar_al_crear: true,
          notificar_x_dias_antes: [5, 1],
          orden: 1
        },
        {
          nombre: 'Código',
          descripcion: 'Código de candado o acceso',
          importancia: 'critico',
          es_default: true,
          dias_relativo: null,
          notificar_al_crear: true,
          notificar_x_dias_antes: [5, 1],
          orden: 2
        },
        {
          nombre: 'Leña',
          descripcion: 'Preparar leña para chimenea',
          importancia: 'critico',
          es_default: true,
          dias_relativo: null,
          notificar_al_crear: true,
          notificar_x_dias_antes: [5, 1],
          orden: 3
        },
        {
          nombre: 'Huevos',
          descripcion: 'Preparar huevos frescos',
          importancia: 'critico',
          es_default: true,
          dias_relativo: null,
          notificar_al_crear: true,
          notificar_x_dias_antes: [5, 1],
          orden: 4
        },
        {
          nombre: 'Agua',
          descripcion: 'Asegurar suministro de agua potable',
          importancia: 'critico',
          es_default: true,
          dias_relativo: null,
          notificar_al_crear: true,
          notificar_x_dias_antes: [5, 1],
          orden: 5
        },
        {
          nombre: 'Hora de inicio de viaje',
          descripcion: 'Confirmar hora estimada de llegada',
          importancia: 'critico',
          es_default: true,
          dias_relativo: null,
          notificar_al_crear: true,
          notificar_x_dias_antes: [5, 1],
          orden: 6
        },
        {
          nombre: 'Preguntar cómo le fue en el camino',
          descripcion: 'Seguimiento post-viaje',
          importancia: 'seguimiento',
          es_default: true,
          dias_relativo: 0,
          notificar_al_terminar: true,
          orden: 7
        },
        {
          nombre: 'Encuesta de satisfacción',
          descripcion: 'Encuesta sobre la experiencia',
          importancia: 'seguimiento',
          es_default: true,
          dias_relativo: 0,
          notificar_al_terminar: true,
          orden: 8
        },
        {
          nombre: 'Reseña',
          descripcion: 'Solicitar reseña o testimonio',
          importancia: 'seguimiento',
          es_default: true,
          dias_relativo: 0,
          notificar_al_terminar: true,
          orden: 9
        }
      ];
      console.log('Clonando', itemsPorDefecto.length, 'items por defecto'); // LOG TEMPORAL
      const itemsCreados = [];
      
      for (const item of itemsPorDefecto) {
        const nuevoItem = await ChecklistItem.create({
          checklist_id: checklistId,
          nombre: item.nombre,
          descripcion: item.descripcion,
          importancia: item.importancia,
          es_default: item.es_default,
          dias_relativo: item.dias_relativo,
          notificar_al_crear: item.notificar_al_crear || false,
          notificar_x_dias_antes: item.notificar_x_dias_antes || null,
          notificar_al_terminar: item.notificar_al_terminar || false,
          orden: item.orden,
          usuario_id: usuarioId,
          completado: false
        }, { transaction });
        
        itemsCreados.push(nuevoItem);
      }
      console.log('Items creados exitosamente:', itemsCreados.length); // LOG TEMPORAL
      return itemsCreados;
    } catch (error) {
      console.error('Error en clonarItemsPorDefecto:', error); // LOG TEMPORAL
      throw new ApiError(500, `Error al clonar items por defecto: ${error.message}`);
    }
  }

  /**
   * Obtener estadísticas de items por usuario
   */
  static async getEstadisticasByUsuario(userId) {
    try {
      const totalItems = await ChecklistItem.count({
        where: { usuario_id: userId }
      });

      const itemsCompletados = await ChecklistItem.count({
        where: {
          usuario_id: userId,
          completado: true
        }
      });

      const itemsPendientes = totalItems - itemsCompletados;

      const itemsPorImportancia = await ChecklistItem.findAll({
        where: { usuario_id: userId },
        attributes: [
          'importancia',
          [ChecklistItem.sequelize.fn('COUNT', ChecklistItem.sequelize.col('id')), 'total']
        ],
        group: ['importancia']
      });

      const itemsPorEstado = await ChecklistItem.findAll({
        where: { usuario_id: userId },
        attributes: [
          'completado',
          [ChecklistItem.sequelize.fn('COUNT', ChecklistItem.sequelize.col('id')), 'total']
        ],
        group: ['completado']
      });

      // Items críticos pendientes
      const criticosPendientes = await ChecklistItem.count({
        where: {
          usuario_id: userId,
          importancia: 'critico',
          completado: false
        }
      });

      return {
        total_items: totalItems,
        items_completados: itemsCompletados,
        items_pendientes: itemsPendientes,
        porcentaje_completado: totalItems > 0 ? ((itemsCompletados / totalItems) * 100).toFixed(2) : 0,
        por_importancia: itemsPorImportancia,
        por_estado: itemsPorEstado,
        criticos_pendientes: criticosPendientes
      };
    } catch (error) {
      throw new ApiError(500, `Error al obtener estadísticas: ${error.message}`);
    }
  }

  /**
   * Obtener items por checklist
   */
  static async getItemsByChecklist(checklistId) {
    try {
      return await ChecklistItem.findAll({
        where: { checklist_id: checklistId },
        order: [['orden', 'ASC']]
      });
    } catch (error) {
      throw new ApiError(500, `Error al obtener items por checklist: ${error.message}`);
    }
  }

  /**
   * Marcar todos los items de un checklist como completados
   */
  static async completarTodosItems(checklistId, transaction = null) {
    try {
      const options = {
        where: { checklist_id: checklistId, completado: false },
        returning: true
      };
      
      if (transaction) {
        options.transaction = transaction;
      }

      const [updatedCount, updatedItems] = await ChecklistItem.update(
        { 
          completado: true,
          fecha_completado: new Date()
        },
        options
      );

      return {
        updatedCount,
        updatedItems
      };
    } catch (error) {
      throw new ApiError(500, `Error al completar items: ${error.message}`);
    }
  }

  /**
   * Obtener items que necesitan notificación
   */
  static async getItemsParaNotificar() {
    try {
      const hoy = new Date();
      
      // Items que notifican al crear (días relativos específicos)
      const itemsNotificar = await ChecklistItem.findAll({
        where: {
          completado: false,
          notificar_x_dias_antes: {
            [Op.ne]: null
          }
        },
        include: [{
          model: Checklist,
          as: 'checklist',
          required: true,
          include: [{
            model: Reservacion,
            as: 'reservacion',
            required: true
          }]
        }]
      });

      // Filtrar items que cumplen con los días de notificación
      const itemsParaNotificar = itemsNotificar.filter(item => {
        if (!item.notificar_x_dias_antes || !Array.isArray(item.notificar_x_dias_antes)) {
          return false;
        }

        const fechaInicio = new Date(item.checklist.reservacion.fecha_inicio);
        
        return item.notificar_x_dias_antes.some(dias => {
          const fechaNotificacion = new Date(fechaInicio);
          fechaNotificacion.setDate(fechaInicio.getDate() - dias);
          
          // Comparar fechas (sin horas)
          const hoyDate = hoy.toISOString().split('T')[0];
          const notifDate = fechaNotificacion.toISOString().split('T')[0];
          
          return hoyDate === notifDate;
        });
      });

      return itemsParaNotificar;
    } catch (error) {
      throw new ApiError(500, `Error al obtener items para notificar: ${error.message}`);
    }
  }

  /**
   * Obtener items con fechas relativas calculadas
   */
  static async getItemsConFechasCalculadas(checklistId) {
    try {
      const items = await ChecklistItem.findAll({
        where: { checklist_id: checklistId },
        include: [{
          model: Checklist,
          as: 'checklist',
          required: true,
          include: [{
            model: Reservacion,
            as: 'reservacion',
            required: true
          }]
        }],
        order: [['orden', 'ASC']]
      });

      // Calcular fecha objetivo para cada item
      const itemsConFechas = items.map(item => {
        const itemJSON = item.toJSON();
        
        if (item.dias_relativo !== null && item.dias_relativo !== undefined) {
          const fechaInicio = new Date(item.checklist.reservacion.fecha_inicio);
          const fechaObjetivo = new Date(fechaInicio);
          fechaObjetivo.setDate(fechaInicio.getDate() + item.dias_relativo);
          
          itemJSON.fecha_objetivo = fechaObjetivo;
          
          // Calcular días restantes
          const hoy = new Date();
          const diferenciaTiempo = fechaObjetivo.getTime() - hoy.getTime();
          const diasRestantes = Math.ceil(diferenciaTiempo / (1000 * 3600 * 24));
          itemJSON.dias_restantes = diasRestantes;
          
          // Determinar estado de urgencia
          if (diasRestantes < 0) {
            itemJSON.estado_urgencia = 'vencido';
          } else if (diasRestantes <= 1) {
            itemJSON.estado_urgencia = 'urgente';
          } else if (diasRestantes <= 3) {
            itemJSON.estado_urgencia = 'proximo';
          } else {
            itemJSON.estado_urgencia = 'normal';
          }
        } else {
          itemJSON.fecha_objetivo = null;
          itemJSON.dias_restantes = null;
          itemJSON.estado_urgencia = 'inmediato';
        }

        return itemJSON;
      });

      return itemsConFechas;
    } catch (error) {
      throw new ApiError(500, `Error al obtener items con fechas calculadas: ${error.message}`);
    }
  }
}

module.exports = ChecklistItemService;