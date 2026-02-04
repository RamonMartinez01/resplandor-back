const ApiError = require('../utils/apiError');
const checklistItemService = require('../services/checklistItemService');
const checklistService = require('../services/checklistService');

const checklistItemsController = {
  // Obtener todos los items de checklist (con filtros opcionales)
  async getAll(req, res, next) {
    try {
      const { checklist_id, completado, importancia, dias_relativo } = req.query;
      
      const filters = {};
      if (checklist_id) filters.checklist_id = checklist_id;
      if (completado !== undefined) filters.completado = completado === 'true';
      if (importancia) filters.importancia = importancia;
      if (dias_relativo !== undefined) filters.dias_relativo = dias_relativo;

      const items = await checklistItemService.getAllChecklistItems(filters);
      
      res.status(200).json({
        success: true,
        data: items,
        count: items.length
      });
    } catch (error) {
      next(error);
    }
  },

  // Obtener un item específico
  async getOne(req, res, next) {
    try {
      const { id } = req.params;
      const item = await checklistItemService.getChecklistItemById(id);

      if (!item) {
        throw new ApiError(404, 'Item de checklist no encontrado');
      }

      res.status(200).json({
        success: true,
        data: item
      });
    } catch (error) {
      next(error);
    }
  },

  // Crear un nuevo item de checklist
  async create(req, res, next) {
    try {
      const itemData = {
        ...req.body,
        usuario_id: req.user.id
      };

      // Verificar que el checklist exista y pertenezca al usuario
      const checklist = await checklistService.getChecklistById(itemData.checklist_id);
      if (!checklist) {
        throw new ApiError(404, 'Checklist no encontrado');
      }

      // Si la reservación no pertenece al usuario, verificar permisos
      // (aquí podrías agregar lógica de autorización adicional)

      const newItem = await checklistItemService.createChecklistItem(itemData);

      res.status(201).json({
        success: true,
        message: 'Item de checklist creado exitosamente',
        data: newItem
      });
    } catch (error) {
      next(error);
    }
  },

  // Actualizar un item de checklist
  async update(req, res, next) {
    try {
      const { id } = req.params;
      const updates = req.body;

      // Verificar que el item exista
      const existingItem = await checklistItemService.getChecklistItemById(id);
      if (!existingItem) {
        throw new ApiError(404, 'Item de checklist no encontrado');
      }

      // Obtener el checklist para verificar permisos
      const checklist = await checklistService.getChecklistById(existingItem.checklist_id);
      
      // Aquí podrías agregar lógica de autorización
      // Por ejemplo, verificar que el usuario tenga permisos sobre esta reservación

      const updatedItem = await checklistItemService.updateChecklistItem(id, updates);

      res.status(200).json({
        success: true,
        message: 'Item de checklist actualizado exitosamente',
        data: updatedItem
      });
    } catch (error) {
      next(error);
    }
  },

  // Eliminar un item de checklist
  async remove(req, res, next) {
    try {
      const { id } = req.params;

      // Verificar que el item exista
      const existingItem = await checklistItemService.getChecklistItemById(id);
      if (!existingItem) {
        throw new ApiError(404, 'Item de checklist no encontrado');
      }

      // Verificar permisos (si el item es por defecto, quizás no se pueda eliminar)
      if (existingItem.es_default) {
        throw new ApiError(400, 'No se pueden eliminar items por defecto');
      }

      await checklistItemService.deleteChecklistItem(id);

      res.status(200).json({
        success: true,
        message: 'Item de checklist eliminado exitosamente'
      });
    } catch (error) {
      next(error);
    }
  },

  // Toggle de estado completado
  async toggleComplete(req, res, next) {
    try {
      const { id } = req.params;

      // Verificar que el item exista
      const existingItem = await checklistItemService.getChecklistItemById(id);
      if (!existingItem) {
        throw new ApiError(404, 'Item de checklist no encontrado');
      }

      const updatedItem = await checklistItemService.toggleChecklistItemCompletion(id);

      res.status(200).json({
        success: true,
        message: `Item ${updatedItem.completado ? 'completado' : 'pendiente'} exitosamente`,
        data: updatedItem
      });
    } catch (error) {
      next(error);
    }
  },

  // Obtener items pendientes por usuario
  async getPendientesByUsuario(req, res, next) {
    try {
      const userId = req.user.id;
      const itemsPendientes = await checklistItemService.getPendientesByUsuario(userId);

      res.status(200).json({
        success: true,
        data: itemsPendientes,
        count: itemsPendientes.length
      });
    } catch (error) {
      next(error);
    }
  },

  // Obtener items críticos próximos (para notificaciones)
  async getCriticosProximos(req, res, next) {
    try {
      const { dias } = req.query;
      const diasParam = dias ? parseInt(dias) : 3; // Por defecto 3 días

      const itemsCriticos = await checklistItemService.getCriticosProximos(diasParam);

      res.status(200).json({
        success: true,
        data: itemsCriticos,
        count: itemsCriticos.length,
        dias: diasParam
      });
    } catch (error) {
      next(error);
    }
  },

  // Reordenar items de un checklist
  async reordenar(req, res, next) {
    try {
      const { checklist_id } = req.params;
      const { nuevosOrdenes } = req.body; // Array de {id, orden}

      if (!Array.isArray(nuevosOrdenes)) {
        throw new ApiError(400, 'Se requiere un array de nuevos órdenes');
      }

      // Verificar que el checklist exista
      const checklist = await checklistService.getChecklistById(checklist_id);
      if (!checklist) {
        throw new ApiError(404, 'Checklist no encontrado');
      }

      const itemsActualizados = await checklistItemService.reordenarItems(
        checklist_id, 
        nuevosOrdenes
      );

      res.status(200).json({
        success: true,
        message: 'Items reordenados exitosamente',
        data: itemsActualizados
      });
    } catch (error) {
      next(error);
    }
  },

  // Clonar items por defecto para un checklist nuevo
  async clonarItemsPorDefecto(req, res, next) {
    try {
      const { checklist_id } = req.params;
      
      // Verificar que el checklist exista
      const checklist = await checklistService.getChecklistById(checklist_id);
      if (!checklist) {
        throw new ApiError(404, 'Checklist no encontrado');
      }

      // Obtener la reservación asociada para calcular fechas relativas
      const reservacion = await checklist.getReservacion();
      if (!reservacion) {
        throw new ApiError(404, 'Reservación no encontrada para este checklist');
      }

      const itemsClonados = await checklistItemService.clonarItemsPorDefecto(
        checklist_id,
        req.user.id,
        reservacion.fecha_inicio,
        reservacion.fecha_fin
      );

      res.status(201).json({
        success: true,
        message: 'Items por defecto clonados exitosamente',
        data: itemsClonados,
        count: itemsClonados.length
      });
    } catch (error) {
      next(error);
    }
  },

  // Estadísticas de items por usuario
  async getEstadisticas(req, res, next) {
    try {
      const userId = req.user.id;
      const estadisticas = await checklistItemService.getEstadisticasByUsuario(userId);

      res.status(200).json({
        success: true,
        data: estadisticas
      });
    } catch (error) {
      next(error);
    }
  }
};

module.exports = checklistItemsController;