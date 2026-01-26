const express = require("express");
const router = express.Router();
const { 
  createClass, 
  getAllClasses,
  updateClass, 
  deleteClass,
  getTrainerClasses,
  cancelClass // <--- Updated Import (was cancelClassByTrainer)
} = require("../controllers/class.controller");
const { verifyToken, allowRoles } = require("../middleware/auth.middleware");

// Public/Member/Admin/Staff can view all
router.get("/", verifyToken, allowRoles("ADMIN", "TRAINER", "MEMBER", "STAFF"), getAllClasses);

// ADMIN and STAFF can Create/Update/Delete (Full Management)
router.post("/", verifyToken, allowRoles("ADMIN", "STAFF"), createClass);
router.put("/:id", verifyToken, allowRoles("ADMIN", "STAFF"), updateClass);
router.delete("/:id", verifyToken, allowRoles("ADMIN", "STAFF"), deleteClass);

// --- CANCEL ROUTE (Updated) ---
// Allows ADMIN, STAFF (any class), and TRAINER (own class) to cancel
router.patch("/:id/cancel", verifyToken, allowRoles("ADMIN", "STAFF", "TRAINER"), cancelClass);

// --- TRAINER ROUTES ---
router.get("/trainer/my-classes", verifyToken, allowRoles("TRAINER"), getTrainerClasses);

module.exports = router;