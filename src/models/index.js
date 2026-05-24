// src/models/index.js
'use strict';

const fs = require('fs');
const path = require('path');
const { sequelize } = require('../config/database');
const { Sequelize } = require('sequelize');
const basename = path.basename(__filename);
const db = {};

// Read all files in this directory (except index.js) and import them as models
fs.readdirSync(__dirname)
  .filter(file => {
    return (
      file.indexOf('.') !== 0 &&
      file !== basename &&
      file.slice(-3) === '.js' &&
      file.indexOf('.test.js') === -1
    );
  })
  .forEach(file => {
    const model = require(path.join(__dirname, file))(sequelize);
    db[model.name] = model;
  });

// configure associations (relations) between models, if exist
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize; // Do we need import sequelize here too? Yas we do

module.exports = db;