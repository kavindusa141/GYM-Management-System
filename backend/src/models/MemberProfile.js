const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const MemberProfile = sequelize.define("MemberProfile", {
  profile_id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true, // <--- VALIDATION: Prevents duplicate profiles for the same user
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
    allowNull: true // We will calculate this automatically
  },

  // Physical Stats
  gender: {
    type: DataTypes.STRING,
    validate: {
      isIn: [['Male', 'Female', 'Other']] // <--- VALIDATION: Only allows these values
    }
  },
  height: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    validate: {
      min: 0 // Cannot be negative
    }
  },
  weight: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    validate: {
      min: 0 // Cannot be negative
    }
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

  // Fitness Details
  fitness_goal: {
    type: DataTypes.STRING,
    defaultValue: 'General Health'
  },
  activity_level: {
    type: DataTypes.STRING,
    defaultValue: 'Moderately Active'
  },
  bmi: DataTypes.DECIMAL(5, 2)

}, {
  tableName: "member_profiles",
  timestamps: false
});

module.exports = MemberProfile;