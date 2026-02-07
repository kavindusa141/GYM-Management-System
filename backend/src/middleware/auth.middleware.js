const jwt = require("jsonwebtoken");
require("dotenv").config();

exports.verifyToken = (req, res, next) => {
  const token = req.headers["authorization"];

  if (!token) {
    return res.status(403).json({ message: "No token provided" });
  }

  jwt.verify(token.split(" ")[1], process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    req.user = decoded;
    next();
  });
};

// Role-based access
exports.allowRoles = (...roles) => {
  return (req, res, next) => {
    // Ensure req.user exists (fixed potential crash if verifyToken not used before)
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied" });
    }
    next();
  };
};

// Convenience helpers
exports.isAdmin = exports.allowRoles('ADMIN');
exports.isTrainer = exports.allowRoles('TRAINER');
exports.isMember = exports.allowRoles('MEMBER');
