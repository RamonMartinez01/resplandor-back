// ROOT-backend/src/models/huesped.js
const { Model, DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

class Huesped extends Model {
    // Método para obtener datos seguros
    toJSON() {
        const values = Object.assign({}, this.get());
        return values;
    }

    // Métodos estáticos para relaciones
    static associate(models) {
        // Un Huésped pertenece a un Usuario
        Huesped.belongsTo(models.Usuario, {
            foreignKey: 'usuario_id',
            as: 'usuario',
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE'
        });

        // Un Huésped puede tener muchas Reservaciones (se agregará después)
        Huesped.hasMany(models.Reservacion, {
            foreignKey: 'huesped_id',
            as: 'reservaciones',
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE'
        });
    }
}

Huesped.init(
    {
        id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
            allowNull: false
        },
        nombre: {
            type: DataTypes.STRING(150),
            allowNull: false,
            validate: {
                notEmpty: {
                    msg: 'El nombre no puede estar vacío'
                },
                len: {
                    args: [2, 150],
                    msg: 'El nombre debe tener entre 2 y 150 caracteres'
                }
            }
        },
        automovil_uno: {
            type: DataTypes.STRING(50),
            allowNull: false
        },
        automovil_dos: {
            type: DataTypes.STRING(50),
            allowNull: false
        },
        automovil_tres: {
            type: DataTypes.STRING(50),
            allowNull: false
        },
        email: {
            type: DataTypes.STRING(255),
            allowNull: true,
            validate: {
                isEmail: {
                    msg: 'Debe ser un email válido'
                }
            }
        },
        telefono: {
            type: DataTypes.STRING(20),
            allowNull: true,
            validate: {
                len: {
                    args: [0, 20],
                    msg: 'El teléfono no puede exceder 20 caracteres'
                }
            }
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
        modelName: 'Huesped',
        tableName: 'huespedes',
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

module.exports = Huesped;