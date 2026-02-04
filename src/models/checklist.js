// ROOT-backend/src/models/checklist.js
const { Model, DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

class Checklist extends Model {
  // Método para obtener datos seguros
  toJSON() {
    const values = Object.assign({}, this.get());
    return values;
  }

  // Método para calcular porcentaje de completado
  async getPorcentajeCompletado() {
    if (!this.items || this.items.length === 0) {
      return 0;
    }
    
    const completados = this.items.filter(item => item.completado).length;
    return Math.round((completados / this.items.length) * 100);
  }

  // Método para verificar si está completado
  estaCompletado() {
    return this.items && this.items.every(item => item.completado);
  }

  // Métodos estáticos para relaciones
  static associate(models) {
    // Un Checklist pertenece a una Reservación
    Checklist.belongsTo(models.Reservacion, {
      foreignKey: 'reservacion_id',
      as: 'reservacion',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });

    // Un Checklist pertenece a un Usuario
    Checklist.belongsTo(models.Usuario, {
      foreignKey: 'usuario_id',
      as: 'usuario',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });

    // Un Checklist tiene muchos Items
    Checklist.hasMany(models.ChecklistItem, {
      foreignKey: 'checklist_id',
      as: 'items',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });
  }
}

Checklist.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    reservacion_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'reservaciones',
        key: 'id'
      }
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
    modelName: 'Checklist',
    tableName: 'checklists',
    underscored: true,
    timestamps: true,
    defaultScope: {
      attributes: {
        exclude: [] // Podemos excluir campos si es necesario
      }
    },
    scopes: {
      porUsuario: (usuarioId) => ({
        where: { usuario_id: usuarioId }
      }),
      conItems: {
        include: [{
          model: sequelize.models.ChecklistItem,
          as: 'items',
          attributes: ['id', 'nombre', 'descripcion', 'completado', 'fecha_completado', 
                      'completado_por_id', 'texto_adicional', 'importancia', 'dias_relativo',
                      'notificar_al_crear', 'notificar_x_dias_antes', 'notificar_al_terminar',
                      'es_default', 'orden']
        }]
      },
      conReservacion: {
        include: [{
          model: sequelize.models.Reservacion,
          as: 'reservacion',
          attributes: ['id', 'fecha_inicio', 'fecha_fin', 'estado_pago', 'vehiculo']
        }]
      },
      conUsuario: {
        include: [{
          model: sequelize.models.Usuario,
          as: 'usuario',
          attributes: ['id', 'nombre_completo', 'email']
        }]
      }
    }
  }
);

module.exports = Checklist;