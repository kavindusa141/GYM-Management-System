const express = require("express");
const router = express.Router();
const { bookClass, cancelBooking, getMyBookings } = require("../controllers/booking.controller");
const { verifyToken, allowRoles } = require("../middleware/auth.middleware");

// All routes require the user to be a logged-in MEMBER
router.post("/book", verifyToken, allowRoles("MEMBER"), bookClass);
router.post("/cancel/:booking_id", verifyToken, allowRoles("MEMBER"), cancelBooking);
router.get("/my-bookings", verifyToken, allowRoles("MEMBER"), getMyBookings);

module.exports = router;