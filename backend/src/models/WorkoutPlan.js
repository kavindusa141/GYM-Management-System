const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const User = require("./User");

const WorkoutPlan = sequelize.define("WorkoutPlan", {
  plan_id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  member_id: {
    type: DataTypes.INTEGER,
    allowNull: true, // Changed to TRUE for common plans
    references: { model: User, key: 'user_id' }
  },
  is_common: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  trainer_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: User, key: 'user_id' }
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  // --- NEW FIELDS ---
  start_date: {
    type: DataTypes.DATEONLY, // YYYY-MM-DD
    allowNull: true
  },
  end_date: {
    type: DataTypes.DATEONLY, // YYYY-MM-DD
    allowNull: true
  },
  duration: {
    type: DataTypes.INTEGER, // Number of days/weeks (stored as number)
    allowNull: true
  },
  updated_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: { model: User, key: 'user_id' }
  },
  // ------------------
  status: {
    type: DataTypes.ENUM('ACTIVE', 'COMPLETED', 'ARCHIVED'),
    defaultValue: 'ACTIVE'
  }
}, {
  tableName: "workout_plans",
  timestamps: true,
  underscored: true
});

// Associations
// Associations are defined in associations.js

module.exports = WorkoutPlan;