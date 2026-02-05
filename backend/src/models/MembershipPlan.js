const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const MembershipPlan = sequelize.define("MembershipPlan", {
  plan_id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  duration_months: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  features: {
    type: DataTypes.JSON, // Keeps the visual bullet points list
    allowNull: true
  },
  
  // --- NEW FEATURES (LOGIC ENFORCEMENT) ---
  
  // 1. Visit Limits (e.g., 3 days/week). Null = Unlimited
  visit_limit_per_week: {
    type: DataTypes.INTEGER,
    allowNull: true, 
    defaultValue: null 
  },

  // 2. Class Booking Limits (e.g., 2 classes/week). Null = Unlimited
  class_limit_per_week: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: null
  },

  // 3. Time Access (Off-Peak) - Defaults to 24/7 (00:00 to 23:59)
  access_start_time: {
    type: DataTypes.TIME,
    defaultValue: '00:00:00'
  },
  access_end_time: {
    type: DataTypes.TIME,
    defaultValue: '23:59:59'
  },

  // 4. Special Trainer Access (Yes/No)
  includes_trainer: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
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