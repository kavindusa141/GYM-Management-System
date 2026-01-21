const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const User = require("./User");
const WorkoutPlan = require("./WorkoutPlan");

const WorkoutLog = sequelize.define("WorkoutLog", {
  log_id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  member_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: User, key: 'user_id' }
  },
  plan_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: WorkoutPlan, key: 'plan_id' }
  },
  date: {
    type: DataTypes.DATEONLY,
    defaultValue: DataTypes.NOW
  },
  duration_mins: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  notes: {
    type: DataTypes.TEXT, // Member's feedback (e.g., "Too heavy")
    allowNull: true
  },
  mood: {
    type: DataTypes.ENUM('Great', 'Good', 'Hard', 'Exhausted'),
    defaultValue: 'Good'
  }
}, {
  tableName: "workout_logs",
  timestamps: true,
  underscored: true
});

// Associations
WorkoutLog.belongsTo(User, { as: 'Member', foreignKey: 'member_id' });
WorkoutLog.belongsTo(WorkoutPlan, { as: 'Plan', foreignKey: 'plan_id' });
User.hasMany(WorkoutLog, { foreignKey: 'member_id' });

module.exports = WorkoutLog;