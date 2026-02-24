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
  date: {
    type: DataTypes.DATEONLY, // Stores YYYY-MM-DD
    allowNull: false
  },
  // Stores array of hours like [6, 7, 8, 14, 15]
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
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['trainer_id', 'date']
    }
  ]
});

TrainerAvailability.belongsTo(User, { foreignKey: 'trainer_id' });

module.exports = TrainerAvailability;