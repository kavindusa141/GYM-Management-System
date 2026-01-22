const express = require("express");
const cors = require("cors");


const User = require("./models/User");             
const MemberProfile = require("./models/MemberProfile"); 
const UserSubscription = require("./models/UserSubscription");
const Payment = require("./models/Payment");
const MembershipPlan = require("./models/MembershipPlan");


// --- DEFINE ASSOCIATIONS HERE ---
User.hasOne(MemberProfile, { foreignKey: 'user_id' });      
MemberProfile.belongsTo(User, { foreignKey: 'user_id' });  


// Subscription Associations
User.hasOne(UserSubscription, { foreignKey: 'user_id' });
UserSubscription.belongsTo(User, { foreignKey: 'user_id' });
UserSubscription.belongsTo(MembershipPlan, { foreignKey: 'plan_id' });

// Payment Associations
User.hasMany(Payment, { foreignKey: 'user_id' });
Payment.belongsTo(User, { foreignKey: 'user_id' });
Payment.belongsTo(MembershipPlan, { foreignKey: 'plan_id' });



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




const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/member", memberRoutes);
app.use("/api/classes", classRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/admin", dashboardRoutes);
app.use("/api/member", dashboardRoutes);
app.use("/api/workouts", workoutRoutes);
app.use("/api/equipment", equipmentRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/memberships", membershipRoutes);

app.use("/uploads", express.static("uploads")); // Allow access to uploaded images

app.get("/", (req, res) => {
  res.send("Gym Management API running");
});

module.exports = app;
