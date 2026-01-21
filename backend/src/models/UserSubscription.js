const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const User = require("./User");
const MembershipPlan = require("./MembershipPlan");

const UserSubscription = sequelize.define("UserSubscription", {
  subscription_id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: User, key: 'user_id' }
  },
  plan_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: { model: MembershipPlan, key: 'plan_id' }
  },
  start_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  end_date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('ACTIVE', 'EXPIRED', 'CANCELLED'),
    defaultValue: 'ACTIVE'
  }
}, {
  tableName: "user_subscriptions",
  timestamps: true,
  underscored: true
});

module.exports = UserSubscription;