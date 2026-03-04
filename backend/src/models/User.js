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

// Define Associations late to avoid circular dependency issues if imported elsewhere
// (Ideally, associations are better placed in index.js or a separate association setup file, 
// but following the existing pattern of simple requires if possible, or putting them here)
// Note: Since User is required in other models, we should actually export first or set up associations in a central place.
// However, looking at MemberProfile.js, it does `MemberProfile.belongsTo(User)`.
// We will assign them in the individual model files to keep it consistent, 
// OR we add them here if we want `User.hasMany(...)`.
// Let's rely on the other files defining the BelongsTo, and we can define HasMany here if we require them.

// For now, I will just export User. 
// The associations User.hasMany(MemberAssignment) and User.hasMany(ProgressLog) 
// will be established when those models are initialized/loaded if we load them in server.js or db.js.
// A common pattern in Sequelize is to have an `index.js` in models folder. 
// Checking `backend/src/models` listing again... there is no index.js.
// So probably associations are defined in the specific model files or haphazardly.
// I will check `WorkoutPlan.js` again to see how it did it.
// WorkoutPlan has: WorkoutPlan.belongsTo(User, ...).
// It does NOT seem to have the reverse User.hasMany(WorkoutPlan) in User.js.
// So I will stick to that pattern: Define associations in the child models where possible, 
// or if I need `User.include(MemberAssignment)`, I'll need to add it here or in a setup phase.

// Let's add the HasMany here to be safe and allow eager loading from User side.
// But I need to require the models first, which might cause circular deps if they require User.
// Best practice without a central index is to just define them later or accept that 
// I might need `User` to be fully defined before requiring children.
// Let's just Add the commented placeholders or leave it be if the others work fine.

module.exports = User;