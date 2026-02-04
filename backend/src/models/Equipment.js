const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Equipment = sequelize.define("Equipment", {
  equipment_id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  category: {
    type: DataTypes.ENUM('Cardio', 'Strength', 'Accessories', 'Other'),
    defaultValue: 'Other'
  },
  status: {
    type: DataTypes.ENUM('Operational', 'Maintenance', 'Out of Order'),
    defaultValue: 'Operational'
  },
  purchase_date: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  last_maintenance: {
    type: DataTypes.DATEONLY,
    allowNull: true
  }
}, {
  tableName: "equipment",
  timestamps: true,   
  underscored: true    
});

module.exports = Equipment;