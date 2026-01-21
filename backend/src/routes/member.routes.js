const express = require("express");
const router = express.Router();

// 1. Import the CORRECT functions (getProfile, updateProfile)
// OLD was: const { saveProfile } = ...
const { getProfile, updateProfile } = require("../controllers/member.controller");
const { verifyToken, allowRoles } = require("../middleware/auth.middleware");

// 2. Define the Routes
// GET profile (for pre-filling the form)
router.get(
  "/profile",
  verifyToken, 
  allowRoles("MEMBER"), 
  getProfile
);

// POST profile (for saving/updating)
router.post(
  "/profile",
  verifyToken,
  allowRoles("MEMBER"),
  updateProfile // <--- This must match the controller export
);

module.exports = router;