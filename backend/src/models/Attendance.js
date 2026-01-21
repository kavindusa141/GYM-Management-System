const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const User = require("./User");

const Attendance = sequelize.define("Attendance", {
  attendance_id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  member_id: { // Matches your DB column 'member_id'
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: User,
      key: 'user_id'
    }
  },
  attendance_date: { // Matches your DB column 'attendance_date'
    type: DataTypes.DATEONLY,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  check_in: { // Matches your DB column 'check_in'
    type: DataTypes.TIME,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  check_out: { // Matches your DB column 'check_out'
    type: DataTypes.TIME,
    allowNull: true
  }
}, {
  tableName: "attendance",
  timestamps: false // Your table doesn't have created_at/updated_at
});

// Association: An Attendance record belongs to a User
Attendance.belongsTo(User, { foreignKey: 'member_id', targetKey: 'user_id' });

module.exports = Attendance;