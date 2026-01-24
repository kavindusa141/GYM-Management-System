const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const SystemSetting = sequelize.define("SystemSetting", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  key_name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true // e.g., 'system_name', 'gym_location'
  },
  value: {
    type: DataTypes.STRING,
    allowNull: false
  }
}, {
  tableName: "system_settings",
  timestamps: false
});

module.exports = SystemSetting;