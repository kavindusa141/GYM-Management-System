const ClassBooking = require("../models/ClassBooking");
const GymClass = require("../models/GymClass");
const User = require("../models/User");
const UserSubscription = require("../models/UserSubscription");
const MembershipPlan = require("../models/MembershipPlan");
const Attendance = require("../models/Attendance"); // <--- Verified Import
const { Op } = require("sequelize");

// 1. Book a Class
exports.bookClass = async (req, res) => {
  try {
    const { class_id } = req.body;
    const user_id = req.user.id; // This is the ID from the token (User table ID)

    // --- 1. Fetch Class Details ---
    const gymClass = await GymClass.findByPk(class_id);
    if (!gymClass) return res.status(404).json({ message: "Class not found" });

    const targetDate = gymClass.class_date;

    // --- 2. Fetch Active Membership ---
    const sub = await UserSubscription.findOne({
      where: { user_id, status: 'ACTIVE' },
      include: [{ model: MembershipPlan }]
    });

    if (!sub) return res.status(400).json({ message: "No active membership found." });

    const plan = sub.MembershipPlan;

    // ============================================================
    // VALIDATION A: ACCESS TIME CHECK (Off-Peak vs Full Time)
    // ============================================================
    if (plan.access_start_time && plan.access_end_time) {
      const classStart = gymClass.start_time;
      const classEnd = gymClass.end_time;
      const planStart = plan.access_start_time;
      const planEnd = plan.access_end_time;

      if (classStart < planStart || classEnd > planEnd) {
        return res.status(403).json({
          message: `This class is outside your membership access hours (${planStart.slice(0, 5)} - ${planEnd.slice(0, 5)}).`
        });
      }
    }

    // ============================================================
    // VALIDATION B: WEEKLY VISIT LIMIT (Attendance + Bookings)
    // ============================================================
    if (plan.visit_limit_per_week !== null) {
      const limit = plan.visit_limit_per_week;

      // 1. Calculate Week Range
      const classDateObj = new Date(targetDate);
      const startOfWeek = new Date(classDateObj);
      startOfWeek.setDate(classDateObj.getDate() - classDateObj.getDay()); // Start (Sunday)
      startOfWeek.setHours(0, 0, 0, 0);

      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6); // End (Saturday)
      endOfWeek.setHours(23, 59, 59, 999);

      // 2. Count "Physical Visits" (Attendance)
      // FIX: Using 'member_id' (from your Attendance model) matched against 'user_id' (from token)
      const attendanceCount = await Attendance.count({
        where: {
          member_id: user_id,
          attendance_date: { [Op.between]: [startOfWeek, endOfWeek] },
          status: { [Op.ne]: 'ABSENT' } // Logic remains to ignore 'ABSENT' if ever added
        }
      });

      // 3. Count "Booked Classes"
      // ClassBooking uses 'user_id' based on standard schema
      const bookingCount = await ClassBooking.count({
        where: {
          user_id,
          status: 'CONFIRMED',
          booking_date: { [Op.between]: [startOfWeek, endOfWeek] }
        }
      });

      const totalUsage = attendanceCount + bookingCount;

      if (totalUsage >= limit) {
        return res.status(403).json({
          message: `Weekly limit reached! Your plan allows ${limit} visits/week. You have visited ${attendanceCount} times and have ${bookingCount} bookings this week.`
        });
      }
    }

    // --- 3. 12-Hour Booking Window Rule ---
    const now = new Date();
    const classStart = new Date(`${targetDate}T${gymClass.start_time}`);
    const msUntilStart = classStart - now;
    const hoursUntilStart = msUntilStart / (1000 * 60 * 60);

    if (msUntilStart < 0) {
      return res.status(400).json({ message: "Cannot book a class that has already started." });
    }

    if (hoursUntilStart < 12) {
      return res.status(400).json({ message: "Booking closed. You must book at least 12 hours before the class starts." });
    }

    // --- 4. Capacity & Duplicate Check ---
    const currentBookings = await ClassBooking.count({ where: { class_id, status: 'CONFIRMED' } });
    if (currentBookings >= gymClass.capacity) return res.status(400).json({ message: "Class is full." });

    const existingBooking = await ClassBooking.findOne({ where: { class_id, user_id, status: 'CONFIRMED' } });
    if (existingBooking) return res.status(400).json({ message: "You have already booked this class." });

    // --- 5. Create Booking ---
    const newBooking = await ClassBooking.create({ user_id, class_id, booking_date: targetDate, status: 'CONFIRMED' });
    res.status(201).json({ message: `Booked successfully for ${targetDate}`, booking: newBooking });

  } catch (err) {
    console.error("Booking Error:", err);
    res.status(500).json({ error: err.message });
  }
};

// 2. Cancel Booking
exports.cancelBooking = async (req, res) => {
  try {
    const { booking_id } = req.params;
    const user_id = req.user.id;

    const booking = await ClassBooking.findOne({
      where: { booking_id, user_id },
      include: [{ model: GymClass }]
    });

    if (!booking) return res.status(404).json({ message: "Booking not found" });
    if (booking.status === 'CANCELLED') return res.status(400).json({ message: "Booking is already cancelled." });

    // --- 12-Hour Cancellation Rule ---
    const now = new Date();
    const gymClass = booking.GymClass;
    const classStart = new Date(`${gymClass.class_date}T${gymClass.start_time}`);

    const msUntilStart = classStart - now;
    const hoursUntilStart = msUntilStart / (1000 * 60 * 60);

    if (msUntilStart <= 0) {
      return res.status(400).json({ message: "Cannot cancel a class that has already started." });
    }

    if (hoursUntilStart < 12) {
      return res.status(400).json({ message: "Cancellation failed. You must cancel at least 12 hours before the class starts." });
    }

    booking.status = 'CANCELLED';
    await booking.save();

    res.json({ message: "Booking cancelled successfully." });
  } catch (err) {
    console.error("Cancellation Error:", err);
    res.status(500).json({ error: err.message });
  }
};

// 3. Get My Bookings
exports.getMyBookings = async (req, res) => {
  try {
    const bookings = await ClassBooking.findAll({
      where: { user_id: req.user.id, status: 'CONFIRMED' },
      include: [{
        model: GymClass,
        attributes: ['title', 'start_time', 'end_time', 'class_date', 'duration', 'day_of_week'],
        include: [{ model: User, as: 'Trainer', attributes: ['name'] }]
      }],
      order: [['booking_date', 'ASC']]
    });

    const now = new Date();
    const formatted = bookings.map(booking => {
      try {
        const cls = booking.GymClass;
        if (!cls) return null; // Skip orphaned bookings

        const dateStr = typeof booking.booking_date === 'string'
          ? booking.booking_date
          : new Date(booking.booking_date).toISOString().split('T')[0];

        const startTimeStr = cls.start_time?.toString() || '00:00:00';
        const endTimeStr = cls.end_time?.toString() || '00:00:00';

        const classStart = new Date(`${dateStr}T${startTimeStr}`);
        const classEnd = new Date(`${dateStr}T${endTimeStr}`);

        const hoursUntilStart = (classStart - now) / (1000 * 60 * 60);
        const hasEnded = classEnd < now;

        return {
          ...booking.toJSON(),
          hours_until_start: Math.round(hoursUntilStart),
          can_cancel: hoursUntilStart >= 12 && !hasEnded,
          class_start: classStart.toISOString(),
          class_end: classEnd.toISOString()
        };
      } catch (mapErr) {
        console.error(`Error processing booking ${booking?.booking_id}:`, mapErr.message);
        throw mapErr;
      }
    }).filter(b => b !== null); // Remove null entries

    res.json(formatted);
  } catch (err) {
    console.error("Get My Bookings Error:", err);
    res.status(500).json({ error: err.message });
  }
};

// 4. Get My Class History (Attended Classes)
exports.getMyClassHistory = async (req, res) => {
  try {
    const history = await ClassBooking.findAll({
      where: { user_id: req.user.id, status: 'ATTENDED' },
      include: [{
        model: GymClass,
        attributes: ['title', 'start_time', 'end_time', 'class_date', 'duration', 'day_of_week'],
        include: [{ model: User, as: 'Trainer', attributes: ['name'] }]
      }],
      order: [['booking_date', 'DESC']]
    });

    const formatted = history.map(booking => {
      return booking.toJSON();
    });

    res.json(formatted);
  } catch (err) {
    console.error("Get My Class History Error:", err);
    res.status(500).json({ error: err.message });
  }
};