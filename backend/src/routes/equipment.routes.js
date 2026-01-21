const express = require("express");
const router = express.Router();
const { 
  getAllEquipment, addEquipment, updateEquipment, deleteEquipment 
} = require("../controllers/equipment.controller");
const { verifyToken, allowRoles } = require("../middleware/auth.middleware");

// Routes
router.get("/", verifyToken, allowRoles("ADMIN"), getAllEquipment);
router.post("/", verifyToken, allowRoles("ADMIN"), addEquipment);
router.put("/:id", verifyToken, allowRoles("ADMIN"), updateEquipment);
router.delete("/:id", verifyToken, allowRoles("ADMIN"), deleteEquipment);

module.exports = router; // <--- CRITICAL: Must export 'router'