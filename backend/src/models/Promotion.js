const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Promotion = sequelize.define("Promotion", {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    discountType: {
        type: DataTypes.ENUM('PERCENTAGE', 'FIXED_AMOUNT'),
        allowNull: false,
        defaultValue: 'FIXED_AMOUNT'
    },
    discountValue: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00
    },
    target: {
        type: DataTypes.ENUM('REGISTRATION_FEE', 'MEMBERSHIP_FIRST_MONTH', 'BOTH'),
        allowNull: false,
        defaultValue: 'REGISTRATION_FEE'
    },
    startDate: {
        type: DataTypes.DATE,
        allowNull: false,
    },
    endDate: {
        type: DataTypes.DATE,
        allowNull: false,
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
    },
    bannerImageUrl: {
        type: DataTypes.STRING,
        allowNull: true,
    }
}, {
    tableName: "promotions",
    timestamps: true,
    createdAt: "created_at",
    updatedAt: "updated_at",
});

module.exports = Promotion;
