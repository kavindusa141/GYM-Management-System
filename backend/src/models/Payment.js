const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const User = require("./User");
const MembershipPlan = require("./MembershipPlan");

const Payment = sequelize.define("Payment", {
  payment_id: {
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
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  payment_method: {
    type: DataTypes.ENUM('CASH', 'TRANSFER', 'CARD'),
    defaultValue: 'CASH'
  },
  slip_url: {
    type: DataTypes.STRING,
    allowNull: true
  },
  reference_number: {
    type: DataTypes.STRING,
    allowNull: true
  },
  transaction_date: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  status: {
    type: DataTypes.ENUM('COMPLETED', 'PENDING', 'VERIFIED', 'FAILED'),
    defaultValue: 'PENDING'
  },
  // --- NEW FIELD ---
  rejection_reason: {
    type: DataTypes.STRING,
    allowNull: true
  },
  // --- REGISTRATION & PROMOTION FIELDS ---
  registration_fee: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    defaultValue: 0.00
  },
  discount_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    defaultValue: 0.00
  },
  promo_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  }
}, {
  tableName: "payments",
  timestamps: false,
  underscored: true
});

module.exports = Payment;