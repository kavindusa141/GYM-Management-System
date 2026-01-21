const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const User = require("./User");
const GymClass = require("./GymClass"); // <--- Changed from 'Class'

const ClassBooking = sequelize.define("ClassBooking", {
  booking_id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'user_id'
    }
  },
  class_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: GymClass, // <--- Link to GymClass
      key: 'class_id'
    }
  },
  booking_date: {
    type: DataTypes.DATEONLY, // Crucial: Stores WHICH Monday they booked (e.g., 2025-10-25)
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('CONFIRMED', 'CANCELLED', 'ATTENDED'),
    defaultValue: 'CONFIRMED'
  }
}, {
  tableName: "class_bookings",
  timestamps: true,
  underscored: true
});

// Associations
ClassBooking.belongsTo(User, { foreignKey: 'user_id' });
ClassBooking.belongsTo(GymClass, { foreignKey: 'class_id' });
GymClass.hasMany(ClassBooking, { foreignKey: 'class_id' });
User.hasMany(ClassBooking, { foreignKey: 'user_id' });

module.exports = ClassBooking;