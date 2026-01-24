const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const User = sequelize.define("User", {
  user_id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },

  member_code: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: true 
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  role: {
    type: DataTypes.ENUM("ADMIN", "STAFF", "TRAINER", "MEMBER"),
    allowNull: false
  },
  phone: DataTypes.STRING,
  status: {
    type: DataTypes.BOOLEAN,
    defaultValue: false 
  },
  
  // OTP Fields (For Registration)
  otp_code: {
    type: DataTypes.STRING,
    allowNull: true
  },
  otp_expires_at: {
    type: DataTypes.DATE,
    allowNull: true
  },

  // --- ADD THESE NEW FIELDS (For Reset Password) ---
  reset_password_token: {
    type: DataTypes.STRING,
    allowNull: true
  },
  reset_password_expires: {
    type: DataTypes.DATE,
    allowNull: true
  },

  // Explicitly map created_at if you want to access it
  created_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },

  // Soft Delete Fields
  is_deleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false
  },
  deleted_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  deletion_reason: {
    type: DataTypes.TEXT,
    allowNull: true
  }

}, {
  tableName: "users",
  timestamps: false,
  underscored: true,

  defaultScope: {
    where: {
      is_deleted: false
    }
  },

  scopes: {
    withDeleted: {
      where: {}
    },
    onlyDeleted: {
      where: { is_deleted: true }
    }
  }
});

module.exports = User;