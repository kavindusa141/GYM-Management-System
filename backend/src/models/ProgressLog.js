const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const User = require("./User");

const ProgressLog = sequelize.define("ProgressLog", {
    log_id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    member_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: User,
            key: 'user_id'
        }
    },
    trainer_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        comment: 'The trainer who logged this entry',
        references: {
            model: User,
            key: 'user_id'
        }
    },
    date: {
        type: DataTypes.DATEONLY,
        defaultValue: DataTypes.NOW
    },
    weight: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true
    },
    bmi: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true
    },
    body_fat_percentage: {
        type: DataTypes.DECIMAL(5, 2),
        allowNull: true
    },
    // Store measurements as JSON: { chest: 40, waist: 32, arms: 15, legs: 24 }
    measurements: {
        type: DataTypes.JSON,
        allowNull: true
    },
    notes: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    tableName: "progress_logs",
    timestamps: true,
    underscored: true
});

// Associations are defined in associations.js

module.exports = ProgressLog;
