const express = require("express");
const router = express.Router();
const { 
  createClass, 
  getAllClasses,
  updateClass, 
  deleteClass,
  getTrainerClasses,    // <--- New Import
  cancelClassByTrainer  // <--- New Import
} = require("../controllers/class.controller");
const { verifyToken, allowRoles } = require("../middleware/auth.middleware");

// Public/Member/Admin can view all
router.get("/", verifyToken, allowRoles("ADMIN", "TRAINER", "MEMBER"), getAllClasses);

// Admin can Create/Delete
router.post("/", verifyToken, allowRoles("ADMIN"), createClass);
router.put("/:id", verifyToken, allowRoles("ADMIN"), updateClass);
router.delete("/:id", verifyToken, allowRoles("ADMIN"), deleteClass);


// --- TRAINER ROUTES ---
router.get("/trainer/my-classes", verifyToken, allowRoles("TRAINER"), getTrainerClasses);
router.patch("/:id/cancel", verifyToken, allowRoles("TRAINER"), cancelClassByTrainer);

module.exports = router;