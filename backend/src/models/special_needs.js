const Sequelize = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  return special_needs.init(sequelize, DataTypes);
}

class special_needs extends Sequelize.Model {
  static init(sequelize, DataTypes) {
  return super.init({
    id: {
      autoIncrement: true,
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: "special_needs_name_key"
    }
  }, {
    sequelize,
    tableName: 'special_needs',
    schema: 'public',
    timestamps: false,
    indexes: [
      {
        name: "special_needs_name_key",
        unique: true,
        fields: [
          { name: "name" },
        ]
      },
      {
        name: "special_needs_pkey",
        unique: true,
        fields: [
          { name: "id" },
        ]
      },
    ]
  });
  }
}
