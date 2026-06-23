const { Model, DataTypes } = require('sequelize');

// Exports the function that recieve the conection
module.exports = (sequelize) => {

 // Use the power of ES6 Classes
  class ContentBlock extends Model {
    /**
* Associations will be here in the future:
* static (e.g., Project.belongsTo(User)) or custom methods.
     */
    static associate(models) {
      // Define associations here
    }
}   
// Initiate model fields
ContentBlock.init({

  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  section: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: "Ejemplo: 'hero', 'navbar', 'projects'",
  },
  locale: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: "Ejemplo: 'en', 'es'",
  },
  payload: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: {},
    comment: "Aquí vivirá todo el texto estructurado en JSON",
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active', // Mapeo explícito a snake_case
  }
}, {
  sequelize, // The magic word
  tableName: 'content_blocks',
  timestamps: true, // create automatically createdAt y updatedAt
  indexes: [
    {
      // Unique composite index: Prevents two active 'hero' records 
      // from existing in 'es'unique: true,
      fields: ['section', 'locale'] 
    }
  ]
});

return ContentBlock;
}