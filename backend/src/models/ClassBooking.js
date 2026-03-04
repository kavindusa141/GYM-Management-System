const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const User = require("./User");
const GymClass = require("./GymClass");

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
      model: GymClass,
      key: 'class_id'
    }
  },
  booking_date: {
    type: DataTypes.DATEONLY,
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
// Associations are defined in associations.js

module.exports = ClassBooking;