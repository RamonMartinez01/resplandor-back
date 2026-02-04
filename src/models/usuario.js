// ROOT-backend/src/models/usuario.js
const { Model, DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const { sequelize } = require('../config/database');

class Usuario extends Model {
  // Método para comparar contraseñas
  async validarPassword(password) {
    return await bcrypt.compare(password, this.password_hash);
  }

  // Método para obtener datos seguros (sin password_hash)
  toJSON() {
    const values = Object.assign({}, this.get());
    delete values.password_hash;
    return values;
  }

  // Método estático para encriptar contraseña
  static async encriptarPassword(password) {
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
  }

   // Métodos estáticos para relaciones
   static associate(models) {
   
  }
}

Usuario.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: {
        name: 'usuarios_email_unique',
        msg: 'El email ya está registrado'
      },
      validate: {
        isEmail: {
          msg: 'Debe ser un email válido'
        },
        notEmpty: {
          msg: 'El email no puede estar vacío'
        }
      }
    },
    password_hash: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'La contraseña no puede estar vacía'
        }
        // SE ELIMINA: len: { args: [60, 60], msg: 'Hash de contraseña inválido' }
      
      }
    },
    nombre_completo: {
      type: DataTypes.STRING(150),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'El nombre completo no puede estar vacío'
        },
        len: {
          args: [2, 150],
          msg: 'El nombre debe tener entre 2 y 150 caracteres'
        }
      }
    },
    rol: {
      type: DataTypes.ENUM('admin', 'operador_a', 'operador_b'),
      allowNull: false,
      defaultValue: 'admin',
      validate: {
        isIn: {
          args: [['admin', 'operador_a', 'operador_b']],
          msg: 'Rol inválido'
        }
      }
    },
    img_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
      validate: {
        isUrl: {
          msg: 'Debe ser una URL válida',
          protocols: ['http', 'https'],
          require_protocol: true
        }
      }
    },
    activo: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    }
  },
  {
    sequelize,
    modelName: 'Usuario',
    tableName: 'usuarios',
    underscored: true, // Convierte createdAt a created_at
    timestamps: true, // Crea created_at y updated_at automáticamente
    hooks: {
      // Hook antes de crear: encriptar contraseña
      beforeCreate: async (usuario) => {
        if (usuario.password_hash) {
          const saltRounds = 10;
          usuario.password_hash = await bcrypt.hash(usuario.password_hash, saltRounds);
        }
      },
      // Hook antes de actualizar: encriptar contraseña si cambió
      beforeUpdate: async (usuario) => {
        if (usuario.changed('password_hash')) {
          const saltRounds = 10;
          usuario.password_hash = await bcrypt.hash(usuario.password_hash, saltRounds);
        }
      }
    },
    defaultScope: {
      attributes: { exclude: ['password_hash'] }
    },
    scopes: {
      // Scope para incluir password_hash (cuando sea necesario)
      conPassword: {
        attributes: { include: ['password_hash'] }
      },
      // Scope para usuarios activos
      activos: {
        where: { activo: true }
      },
      // Scope por rol
      porRol: (rol) => ({
        where: { rol }
      })
    }
  }
);

module.exports = Usuario;