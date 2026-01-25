const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const User = require("./User");

const TrainerAvailability = sequelize.define("TrainerAvailability", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  trainer_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: User, key: 'user_id' }
  },
  day_of_week: {
    type: DataTypes.ENUM('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'),
    allowNull: false
  },
  // Stores array of hours like [6, 7, 8, 14, 15]
  // Note: If using SQLite/MySQL 5.7+, JSON works. If older, we use TEXT and JSON.parse/stringify manually.
  slots: {
    type: DataTypes.JSON, 
    defaultValue: []
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: "trainer_availability",
  timestamps: true
});

TrainerAvailability.belongsTo(User, { foreignKey: 'trainer_id' });

module.exports = TrainerAvailability;