const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

// ===============================
// IMPORT MODELS (FOR ASSOCIATIONS)
// ===============================
const User = require("./models/User");
const MemberProfile = require("./models/MemberProfile");
const UserSubscription = require("./models/UserSubscription");
const Payment = require("./models/Payment");
const MembershipPlan = require("./models/MembershipPlan");
const Attendance = require("./models/Attendance");

// ===============================
// DEFINE ASSOCIATIONS (ONCE)
// ===============================

// User ↔ Member Profile
User.hasOne(MemberProfile, { foreignKey: "user_id" });
MemberProfile.belongsTo(User, { foreignKey: "user_id" });

// User ↔ Subscription
User.hasMany(UserSubscription, { foreignKey: "user_id" });
UserSubscription.belongsTo(User, { foreignKey: "user_id" });

// Subscription ↔ Plan
UserSubscription.belongsTo(MembershipPlan, { foreignKey: "plan_id" });

// User ↔ Payments
User.hasMany(Payment, { foreignKey: "user_id" });
Payment.belongsTo(User, { foreignKey: "user_id", onDelete: 'RESTRICT' });

// Payment ↔ Plan
Payment.belongsTo(MembershipPlan, { foreignKey: "plan_id" });

User.hasMany(Attendance, { foreignKey: "member_id" });
Attendance.belongsTo(User, { foreignKey: "member_id" });

// ===============================
// IMPORT ROUTES
// ===============================
const authRoutes = require("./routes/auth.routes");
const adminRoutes = require("./routes/admin.routes");
const memberRoutes = require("./routes/member.routes");
const classRoutes = require("./routes/class.routes");
const attendanceRoutes = require("./routes/attendance.routes");
const paymentRoutes = require("./routes/payment.routes");
const dashboardRoutes = require("./routes/dashboard.routes");
const workoutRoutes = require("./routes/workout.routes");
const equipmentRoutes = require("./routes/equipment.routes");
const bookingRoutes = require("./routes/booking.routes");
const membershipRoutes = require("./routes/membership.routes");
const settingsRoutes = require("./routes/settings.routes");
const availabilityRoutes = require("./routes/availability.routes");


// ===============================
// APP INITIALIZATION
// ===============================
const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// ===============================
// ROUTE REGISTRATION
// ===============================
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/member", memberRoutes);
app.use("/api/classes", classRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/workouts", workoutRoutes);
app.use("/api/equipment", equipmentRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/memberships", membershipRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api/availability", availabilityRoutes);

// Dashboard routes (shared but role-protected internally)
app.use("/api/admin", dashboardRoutes);
app.use("/api/member", dashboardRoutes);
app.use("/api/dashboard", dashboardRoutes);

// ===============================
// STATIC FILE SERVING (CRITICAL)
// ===============================
app.use("/uploads", express.static("uploads"));

// ===============================
// ROOT TEST ROUTE
// ===============================
app.get("/", (req, res) => {
  res.send("Gym Management API running");
});

module.exports = app;
