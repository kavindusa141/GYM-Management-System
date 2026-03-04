const jwt = require("jsonwebtoken");
const User = require("../models/User"); // Added User model for strict checking
require("dotenv").config();

exports.verifyToken = async (req, res, next) => {
  const token = req.headers["authorization"];

  if (!token) {
    return res.status(403).json({ message: "No token provided" });
  }

  try {
    const decoded = jwt.verify(token.split(" ")[1], process.env.JWT_SECRET);

    // RBAC HARDENING: Verify the user actually still exists and isn't deleted/banned
    const user = await User.findByPk(decoded.id || decoded.user_id);

    if (!user) {
      return res.status(401).json({ message: "User account no longer exists." });
    }
    if (user.is_deleted) {
      return res.status(403).json({ message: "This account has been deleted." });
    }
    // Some roles like Member have a 'status' = false indicating they are inactive
    if (user.role === 'MEMBER' && !user.status) {
      return res.status(403).json({ message: "This account is inactive or banned." });
    }

    // Attach fresh user details from DB to req for downstream usage
    // We map the database's `user_id` to `.id` so backward compatibility
    // with older endpoints (like /api/workouts/members etc) doesn't break.
    req.user = {
      ...user.toJSON(),
      id: user.user_id
    };
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: "Session expired. Please log in again." });
    }
    return res.status(401).json({ message: "Unauthorized or invalid token." });
  }
};

// Role-based access
exports.allowRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied. Insufficient permissions." });
    }
    next();
  };
};

// Convenience helpers
exports.isAdmin = exports.allowRoles('ADMIN');
exports.isTrainer = exports.allowRoles('TRAINER');
exports.isMember = exports.allowRoles('MEMBER');
