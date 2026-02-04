// ROOT-backend/src/models/cabana.js 
// este es el modelo para las cabañas
const { Model, DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

class Cabana extends Model {
  // Método para obtener datos seguros
  toJSON() {
    const values = Object.assign({}, this.get());
    return values;
  }

  // Métodos estáticos para relaciones
  static associate(models) {

    // Una Cabaña puede pertenecer a muchas Reservaciones (muchos a muchos)
    Cabana.belongsToMany(models.Reservacion, {
      through: 'reservacion_cabanas',
      foreignKey: 'cabana_id',
      otherKey: 'reservacion_id',
      as: 'reservaciones',
      timestamps: false
    });
  }
}

Cabana.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    tipo: {
      type: DataTypes.ENUM('establo', 'adobe', 'estrellas'),
      allowNull: false,
      defaultValue: 'establo',
      validate: {
        isIn: {
          args: [['establo', 'adobe', 'estrellas']],
          msg: 'Tipo de cabaña inválido'
        }
      }
    },
    nombre: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: {
        name: 'cabanas_nombre_unique',
        msg: 'El nombre de la cabaña ya existe'
      },
      validate: {
        notEmpty: {
          msg: 'El nombre no puede estar vacío'
        },
        len: {
          args: [2, 100],
          msg: 'El nombre debe tener entre 2 y 100 caracteres'
        }
      }
    },
    descripcion: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    capacidad: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 2,
      validate: {
        min: {
          args: [1],
          msg: 'La capacidad debe ser al menos 1'
        },
        max: {
          args: [20],
          msg: 'La capacidad no puede exceder 20'
        }
      }
    },
    precio_base: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0,
      validate: {
        min: {
          args: [0],
          msg: 'El precio base no puede ser negativo'
        }
      }
    },
    activa: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    }
    // NOTA: usuario_id ha sido eliminado
  },
  {
    sequelize,
    modelName: 'Cabana',
    tableName: 'cabanas',
    underscored: true,
    timestamps: true,
    defaultScope: {
      where: {
        activa: true
      }
    },
    scopes: {
      todas: {
        where: {}
      },
      porTipo: (tipo) => ({
        where: { tipo }
      })
      // NOTA: Se eliminó el scope 'porUsuario'..
    }
  }
);

// NOTA: También debemos eliminar la asociación con Usuario en el método associate
// Si hay un método associate, hay que quitarlo o comentarlo

module.exports = Cabana;