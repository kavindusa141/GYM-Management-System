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
    allowNull: false,
    references: { model: User, key: 'user_id' }
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
WorkoutPlan.belongsTo(User, { as: 'Member', foreignKey: 'member_id' });
WorkoutPlan.belongsTo(User, { as: 'Trainer', foreignKey: 'trainer_id' });

module.exports = WorkoutPlan;