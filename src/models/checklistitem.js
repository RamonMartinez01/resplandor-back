// ROOT-backend/src/models/checklistitem.js
const { Model, DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

class ChecklistItem extends Model {
  // Método para obtener datos seguros
  toJSON() {
    const values = Object.assign({}, this.get());
    return values;
  }

  // Método para marcar como completado
  async marcarCompletado(usuarioId, textoAdicional = null) {
    const updates = {
      completado: true,
      fecha_completado: new Date(),
      completado_por_id: usuarioId
    };

    if (textoAdicional !== null) {
      updates.texto_adicional = textoAdicional;
    }

    return await this.update(updates);
  }

  // Método para desmarcar como completado
  async desmarcarCompletado() {
    return await this.update({
      completado: false,
      fecha_completado: null,
      completado_por_id: null,
      texto_adicional: null
    });
  }

  // Método para verificar si está activo según fechas de reservación
  estaActivo(fechaInicio, fechaFin) {
    const hoy = new Date();
    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);

    // Si no tiene programación (null), está activo
    if (this.dias_relativo === null) {
      return true;
    }

    // Si es días antes de la fecha de inicio
    if (this.dias_relativo < 0) {
      const fechaActivacion = new Date(inicio);
      fechaActivacion.setDate(fechaActivacion.getDate() + this.dias_relativo);
      return hoy >= fechaActivacion;
    }

    // Si es al terminar la estancia (0)
    if (this.dias_relativo === 0) {
      return hoy >= fin;
    }

    return false;
  }

  // Métodos estáticos para relaciones
  static associate(models) {
    // Un ChecklistItem pertenece a un Checklist
    ChecklistItem.belongsTo(models.Checklist, {
      foreignKey: 'checklist_id',
      as: 'checklist',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });

    // Un ChecklistItem pertenece a un Usuario (creador)
    ChecklistItem.belongsTo(models.Usuario, {
      foreignKey: 'usuario_id',
      as: 'usuario',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });

    // Un ChecklistItem puede ser completado por un Usuario
    ChecklistItem.belongsTo(models.Usuario, {
      foreignKey: 'completado_por_id',
      as: 'completado_por',
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    });
  }
}

ChecklistItem.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    checklist_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'checklists',
        key: 'id'
      }
    },
    nombre: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'El nombre no puede estar vacío'
        },
        len: {
          args: [2, 255],
          msg: 'El nombre debe tener entre 2 y 255 caracteres'
        }
      }
    },
    descripcion: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    texto_adicional: {
      type: DataTypes.STRING(250),
      allowNull: true,
      comment: 'Campo para anotaciones del usuario'
    },
    completado: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    fecha_completado: {
      type: DataTypes.DATE,
      allowNull: true,
      validate: {
        isDate: {
          msg: 'Fecha de completado inválida'
        }
      }
    },
    completado_por_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'usuarios',
        key: 'id'
      }
    },
    importancia: {
      type: DataTypes.ENUM('critico', 'importante', 'seguimiento'),
      allowNull: false,
      defaultValue: 'importante',
      validate: {
        isIn: {
          args: [['critico', 'importante', 'seguimiento']],
          msg: 'Importancia inválida'
        }
      }
    },
    es_default: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Indica si es un item por defecto'
    },
    dias_relativo: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Días relativos a fecha_inicio: null=inmediato, -5=5 días antes, 0=al terminar'
    },
    notificar_al_crear: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Notificar al crear la reservación'
    },
    notificar_x_dias_antes: {
      type: DataTypes.ARRAY(DataTypes.INTEGER),
      allowNull: true,
      comment: 'Array de días para notificar antes (ej: [5, 1])'
    },
    notificar_al_terminar: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Notificar al terminar la estancia'
    },
    orden: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    usuario_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'usuarios',
        key: 'id'
      }
    }
  },
  {
    sequelize,
    modelName: 'ChecklistItem',
    tableName: 'checklist_items',
    underscored: true,
    timestamps: true,
    defaultScope: {
      order: [['orden', 'ASC']]
    },
    scopes: {
      porChecklist: (checklistId) => ({
        where: { checklist_id: checklistId }
      }),
      completados: {
        where: { completado: true }
      },
      pendientes: {
        where: { completado: false }
      },
      porImportancia: (importancia) => ({
        where: { importancia }
      }),
      defaults: {
        where: { es_default: true }
      },
      personalizados: {
        where: { es_default: false }
      },
      activos: (fechaInicio, fechaFin) => {
        const hoy = new Date();
        const inicio = new Date(fechaInicio);
        const fin = new Date(fechaFin);
        
        return {
          where: {
            [sequelize.Op.or]: [
              { dias_relativo: null },
              {
                [sequelize.Op.and]: [
                  { dias_relativo: { [sequelize.Op.lt]: 0 } },
                  sequelize.literal(`
                    DATE('${inicio.toISOString().split('T')[0]}'::date + 
                    (dias_relativo || ' days')::interval) <= DATE('${hoy.toISOString().split('T')[0]}')
                  `)
                ]
              },
              {
                [sequelize.Op.and]: [
                  { dias_relativo: 0 },
                  { [sequelize.Op.lte]: hoy } // hoy >= fecha_fin
                ]
              }
            ]
          }
        };
      }
    }
  }
);

module.exports = ChecklistItem;