const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");
const User = require("./User");

const GymClass = sequelize.define("GymClass", {
  class_id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  // Matches your DB column 'title'
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  // Added this in Step 1 SQL - Required for the form
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  trainer_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: User,
      key: 'user_id'
    }
  },
  // --- REAL TIME FIELDS ---
  class_date: {
    type: DataTypes.DATEONLY, // YYYY-MM-DD
    allowNull: false
  },
  start_time: {
    type: DataTypes.TIME,
    allowNull: false
  },
  end_time: {
    type: DataTypes.TIME,
    allowNull: false
  },
  capacity: {
    type: DataTypes.INTEGER,
    defaultValue: 20
  },
  delayed_start_time: {
    type: DataTypes.TIME,
    allowNull: true
  },
  delay_reason: {
    type: DataTypes.STRING,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('SCHEDULED', 'COMPLETED', 'CANCELLED'),
    defaultValue: 'SCHEDULED'
  },
  cancelled_by_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: User,
      key: 'user_id'
    }
  },
  cancelled_by_name: {
    type: DataTypes.STRING,
    allowNull: true
  },
  cancelled_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  is_deleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },

  // --- LEGACY FIELDS (Auto-calculated) ---
  day_of_week: {
    type: DataTypes.STRING,
    allowNull: true
  },
  duration: {
    type: DataTypes.INTEGER,
    defaultValue: 60
  }
}, {
  tableName: "gym_classes",
  timestamps: false, // Set to true only if you have created_at columns in DB
  underscored: true,
  hooks: {
    beforeValidate: (gymClass) => {
      // 1. Auto-calculate Day of Week from Date
      if (gymClass.class_date) {
        const date = new Date(gymClass.class_date);
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        gymClass.day_of_week = days[date.getDay()];
      }
      // 2. Auto-calculate Duration (minutes) from Start/End Time
      if (gymClass.start_time && gymClass.end_time) {
        const start = new Date(`2000-01-01T${gymClass.start_time}`);
        const end = new Date(`2000-01-01T${gymClass.end_time}`);
        const diffMs = end - start;
        gymClass.duration = Math.floor((diffMs / 1000) / 60);
      }
    }
  }
});

// Associations are defined in associations.js

module.exports = GymClass;