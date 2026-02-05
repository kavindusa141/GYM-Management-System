const express = require("express");
const router = express.Router();
const { 
  createClass, 
  getAllClasses, 
  updateClass, 
  updateClassStatus, 
  deleteClass, 
  getTrainerClasses
} = require("../controllers/class.controller");
const { verifyToken, allowRoles } = require("../middleware/auth.middleware");

// Get all classes (Admin, Staff, Trainer, Member can view)
router.get("/", verifyToken, allowRoles("ADMIN", "TRAINER", "MEMBER", "STAFF"), getAllClasses);

// Create Class (Admin & Staff Only)
router.post("/", verifyToken, allowRoles("ADMIN", "STAFF"), createClass);

// Edit Class Details (Admin & Staff Only)
router.put("/:id", verifyToken, allowRoles("ADMIN", "STAFF"), updateClass);

// Update Status (Cancel/Complete/Restore) - Admin, Staff, and Trainer can perform on their classes
router.put("/:id/status", verifyToken, allowRoles("ADMIN", "STAFF", "TRAINER"), updateClassStatus);

// Delete Class (Admin & Staff Only)
router.delete("/:id", verifyToken, allowRoles("ADMIN", "STAFF"), deleteClass);

// Trainer View - Get trainer's assigned classes (must be placed AFTER other routes to avoid conflict)
router.get("/trainer/my-classes", verifyToken, allowRoles("TRAINER"), getTrainerClasses);

module.exports = router;