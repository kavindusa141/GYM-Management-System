const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const User = require("./User");

const MemberAssignment = sequelize.define("MemberAssignment", {
    assignment_id: {
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
        references: {
            model: User,
            key: 'user_id'
        }
    },
    assigned_at: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    },
    status: {
        type: DataTypes.ENUM('ACTIVE', 'INACTIVE'),
        defaultValue: 'ACTIVE'
    }
}, {
    tableName: "member_assignments",
    timestamps: false,
    underscored: true
});

// Associations are defined in associations.js

module.exports = MemberAssignment;
