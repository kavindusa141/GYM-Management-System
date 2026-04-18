const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const User = require("./User"); // Import User Model

const MemberProfile = sequelize.define("MemberProfile", {
  profile_id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
    validate: {
      notNull: { msg: "User ID is required" }
    }
  },
  
  // Date & Age
  date_of_birth: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    validate: {
      isDate: { msg: "Must be a valid date" },
      notNull: { msg: "Date of Birth is required" }
    }
  },
  age: {
    type: DataTypes.INTEGER,
    allowNull: true
  },

  // Physical Stats
  gender: {
    type: DataTypes.STRING,
    validate: {
      isIn: [['Male', 'Female', 'Other']] 
    }
  },
  height: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    validate: { min: 0 }
  },
  weight: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    validate: { min: 0 }
  },
  
  // Contact & Medical
  emergency_contact: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: { msg: "Emergency contact is required" }
    }
  },
  medical_conditions: {
    type: DataTypes.TEXT,
    allowNull: true
  },

  fitness_goal: {
    type: DataTypes.STRING,
    defaultValue: 'General Health'
  },
  bmi: DataTypes.DECIMAL(5, 2)

}, {
  tableName: "member_profiles",
  timestamps: false
});

// --- ADD ASSOCIATION HERE ---
MemberProfile.belongsTo(User, { foreignKey: 'user_id' });

module.exports = MemberProfile;