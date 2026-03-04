const express = require("express");
const router = express.Router();
const { verifyToken, allowRoles } = require("../middleware/auth.middleware");
const { 
  updateAccountInfo, 
  changePassword, 
  getSystemSettings,
  getAccountInfo, 
  updateSystemSettings 
} = require("../controllers/settings.controller");

// Public (For Landing Page)
router.get("/public-config", getSystemSettings);
router.get("/account", verifyToken, getAccountInfo);

// User Settings (Authenticated)
router.put("/update-account", verifyToken, updateAccountInfo);
router.put("/change-password", verifyToken, changePassword);

// System Settings (Admin Only)
router.put("/system-config", verifyToken, allowRoles("ADMIN"), updateSystemSettings);

module.exports = router;