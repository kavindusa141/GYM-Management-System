const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const User = require("./User");

const GymClass = sequelize.define("GymClass", {
  class_id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  trainer_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'user_id'
    }
  },
  day_of_week: {
    type: DataTypes.ENUM('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'),
    allowNull: false
  },
  start_time: {
    type: DataTypes.TIME, // Stores "14:30:00"
    allowNull: false
  },
  duration: {
    type: DataTypes.INTEGER, // In minutes (e.g., 60)
    defaultValue: 60
  },
  capacity: {
    type: DataTypes.INTEGER,
    defaultValue: 20
  },
  // --- NEW FIELD ---
  status: {
    type: DataTypes.ENUM('SCHEDULED', 'CANCELLED', 'COMPLETED'),
    defaultValue: 'SCHEDULED'
  }
}, {
  tableName: "gym_classes",
  timestamps: false
});

// Associations
GymClass.belongsTo(User, { as: 'Trainer', foreignKey: 'trainer_id' });

module.exports = GymClass;