const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const MembershipPlan = sequelize.define("MembershipPlan", {
  plan_id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING, // e.g. "Gold Access"
    allowNull: false
  },
  price: {
    type: DataTypes.DECIMAL(10, 2), // e.g. 5000.00
    allowNull: false
  },
  duration_months: {
    type: DataTypes.INTEGER, // e.g. 1, 3, 12
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  features: {
    type: DataTypes.JSON, // Store bullet points as JSON array
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('ACTIVE', 'INACTIVE'),
    defaultValue: 'ACTIVE'
  }
}, {
  tableName: "membership_plans",
  timestamps: true,
  underscored: true
});

module.exports = MembershipPlan;