// src/models/Project.js  
const { Model, DataTypes } = require('sequelize');

// Exports the function that recieve the conection
module.exports = (sequelize) => {
  // Use the power of ES6 Classes
  class Project extends Model {
    /**
* Associations will be here in the future:
* static (e.g., Project.belongsTo(User)) or custom methods.
     */
    static associate(models) {
      // Define associations here
    }
}
// Initiate model fields
Project.init({
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: "El nombre del proyecto, ej: 'Yoin-Travel'",
  },
  slug: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    comment: "Identificador para la URL, ej: 'yoin-travel'",
  },
  tags: {
    // ¡Superpoder de Postgres! Arrays nativos en la base de datos.
    type: DataTypes.ARRAY(DataTypes.STRING),
    defaultValue: [],
  },
  imageUrl: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'image_url',
  },
  repositories: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: [],
    comment: "Array de repositorios. Ej: [{ label: 'Frontend', url: '...' }]"
  },
  liveDemoUrl: {
    type: DataTypes.STRING,
    allowNull: true,
    field: 'live_demo_url',
  },
  isFeatured: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'is_featured',
  },
  localizedContent: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: {},
    comment: "Datos flexibles y multi-idioma. Ej: { es: { description: '...' }, en: { description: '...' } }",
    field: 'localized_content',
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    field: 'is_active', // Mapeo explícito a snake_case
  }
}, {
  sequelize,
  tableName: 'projects',
  underscored: true,
  timestamps: true,
});

return Project;}