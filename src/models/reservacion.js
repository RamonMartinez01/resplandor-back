// ROOT-backend/src/models/reservacion.js
const { Model, DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

class Reservacion extends Model {
  // Método para obtener datos seguros
  toJSON() {
    const values = Object.assign({}, this.get());
    return values;
  }

  // Método para calcular días de estancia
  getDiasEstancia() {
    const inicio = new Date(this.fecha_inicio);
    const fin = new Date(this.fecha_fin);
    const diferencia = fin.getTime() - inicio.getTime();
    return Math.ceil(diferencia / (1000 * 3600 * 24));
  }

  // Método para verificar si está activa (futura o en curso)
  estaActiva() {
    const hoy = new Date();
    const fin = new Date(this.fecha_fin);
    return fin >= hoy;
  }

  // Métodos estáticos para relaciones
  static associate(models) {
    // Una Reservación pertenece a un Huésped
    Reservacion.belongsTo(models.Huesped, {
      foreignKey: 'huesped_id',
      as: 'huesped',
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE'
    });

    // Una Reservación pertenece a un Usuario
    Reservacion.belongsTo(models.Usuario, {
      foreignKey: 'usuario_id',
      as: 'usuario',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });

    // Una Reservación puede tener muchas Cabañas (muchos a muchos)
    Reservacion.belongsToMany(models.Cabana, {
      through: 'reservacion_cabanas',
      foreignKey: 'reservacion_id',
      otherKey: 'cabana_id',
      as: 'cabanas',
      timestamps: false
    });

    // Una Reservación tiene un Checklist
    Reservacion.hasOne(models.Checklist, {
      foreignKey: 'reservacion_id',
      as: 'checklist',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });
  }
}

Reservacion.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    huesped_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'huespedes',
        key: 'id'
      }
    },
    fecha_inicio: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      validate: {
        isDate: {
          msg: 'Fecha de inicio inválida'
        },
        notEmpty: {
          msg: 'La fecha de inicio es requerida'
        }
      }
    },
    fecha_fin: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      validate: {
        isDate: {
          msg: 'Fecha de fin inválida'
        },
        notEmpty: {
          msg: 'La fecha de fin es requerida'
        },
        esPosteriorInicio(value) {
          if (new Date(value) <= new Date(this.fecha_inicio)) {
            throw new Error('La fecha de fin debe ser posterior a la fecha de inicio');
          }
        }
      }
    },
    estado_pago: {
      type: DataTypes.ENUM('pendiente', 'pago-50-porciento', 'pagado-total'),
      allowNull: false,
      defaultValue: 'pendiente',
      validate: {
        isIn: {
          args: [['pendiente', 'pago-50-porciento', 'pagado-total']],
          msg: 'Estado de pago inválido'
        }
      }
    },
    monto_total: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: {
          args: [0],
          msg: 'El monto total no puede ser negativo'
        }
      }
    },
    anticipo_pagado: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      validate: {
        min: {
          args: [0],
          msg: 'El anticipo no puede ser negativo'
        }
      }
    },
    vehiculo: {
      type: DataTypes.STRING(100),
      allowNull: false,
      defaultValue: 'No'
    },
    notas: {
      type: DataTypes.TEXT,
      allowNull: true
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
    modelName: 'Reservacion',
    tableName: 'reservaciones',
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
      activas: {
        where: {
          fecha_fin: {
            [sequelize.Sequelize.Op.gte]: new Date()
          }
        }
      },
      pasadas: {
        where: {
          fecha_fin: {
            [sequelize.Sequelize.Op.lt]: new Date()
          }
        }
      },
      conHuesped: {
        include: [{
          model: sequelize.models.Huesped,
          as: 'huesped',
          attributes: ['id', 'nombre', 'email', 'telefono']
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

module.exports = Reservacion;