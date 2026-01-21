const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const WorkoutPlan = require("./WorkoutPlan");

const WorkoutExercise = sequelize.define("WorkoutExercise", {
  exercise_id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  plan_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: WorkoutPlan, key: 'plan_id' }
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  sets: {
    type: DataTypes.INTEGER,
    defaultValue: 3
  },
  reps: {
    type: DataTypes.STRING,
    defaultValue: "10"
  },
  weight: {
    type: DataTypes.STRING,
    allowNull: true
  },
  notes: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  tableName: "workout_exercises",
  timestamps: false,
  underscored: true
});

WorkoutPlan.hasMany(WorkoutExercise, { foreignKey: 'plan_id', onDelete: 'CASCADE' });
WorkoutExercise.belongsTo(WorkoutPlan, { foreignKey: 'plan_id' });

module.exports = WorkoutExercise;