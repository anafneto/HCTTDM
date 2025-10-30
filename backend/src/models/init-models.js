const DataTypes = require("sequelize").DataTypes;
const _special_needs = require("./special_needs");
const _users = require("./users");

function initModels(sequelize) {
  const special_needs = _special_needs(sequelize, DataTypes);
  const users = _users(sequelize, DataTypes);


  return {
    special_needs,
    users,
  };
}
module.exports = initModels;
module.exports.initModels = initModels;
module.exports.default = initModels;
