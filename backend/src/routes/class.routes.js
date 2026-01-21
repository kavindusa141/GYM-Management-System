const express = require("express");
const router = express.Router();
const { createClass, getAllClasses, deleteClass } = require("../controllers/class.controller");
const { verifyToken, allowRoles } = require("../middleware/auth.middleware");

router.post("/", verifyToken, allowRoles("ADMIN"), createClass);
router.get("/", verifyToken, allowRoles("ADMIN", "TRAINER", "MEMBER"), getAllClasses);
router.delete("/:id", verifyToken, allowRoles("ADMIN"), deleteClass);

module.exports = router;