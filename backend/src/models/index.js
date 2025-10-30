const { Sequelize } = require('sequelize');
const sequelize = require('./database');
const initModels = require('./init-models');

const db = initModels(sequelize);

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;