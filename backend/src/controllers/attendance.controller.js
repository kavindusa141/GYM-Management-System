const Attendance = require("../models/Attendance");
const User = require("../models/User");
const UserSubscription = require("../models/UserSubscription");
const MembershipPlan = require("../models/MembershipPlan");
const ClassBooking = require("../models/ClassBooking"); 
const crypto = require("crypto"); 
const { Op } = require("sequelize");

// --- HELPER: Calculate Duration in Minutes ---
const calculateDuration = (startTime, endTime) => {
  // Create dummy dates to compare times (Treating strings as UTC ensures correct diff)
  const start = new Date(`1970-01-01T${startTime}Z`);
  const end = new Date(`1970-01-01T${endTime}Z`);
  const diffMs = end - start;
  // Return minutes (rounded)
  return Math.round(diffMs / 60000); 
};

// --- NEW HELPER: Validate Entry Logic (Time & Limits) ---
const validateEntry = async (userId) => {
  // 1. Get Active Subscription
  // This ensures we validate against the member's CURRENT plan
  const sub = await UserSubscription.findOne({
    where: { user_id: userId, status: 'ACTIVE' },
    include: [{ model: MembershipPlan }]
  });

  if (!sub) return { valid: false, message: "No active membership found." };
  
  const plan = sub.MembershipPlan;
  const now = new Date();

  // ---------------------------------------------------------
  // VALIDATION 1: ACCESS TIME (Dynamic from Plan)
  // ---------------------------------------------------------
  // Get current time in strictly 24-hour format (HH:MM:SS)
  const currentTimeStr = now.toLocaleTimeString('en-GB', { hour12: false }); 
  
  // Check if the plan has time restrictions defined in the database
  if (plan.access_start_time && plan.access_end_time) {
    // Compare string values: e.g. "19:00:00" > "17:00:00"
    if (currentTimeStr < plan.access_start_time || currentTimeStr > plan.access_end_time) {
      return { 
        valid: false, 
        message: `Access denied. Your plan allows entry between ${plan.access_start_time} and ${plan.access_end_time}.` 
      };
    }
  }

  // ---------------------------------------------------------
  // VALIDATION 2: WEEKLY VISIT LIMIT (Attendance + Bookings)
  // ---------------------------------------------------------
  if (plan.visit_limit_per_week !== null) {
    // Calculate start (Sunday) and end (Saturday) of the current week
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay()); // Go back to Sunday
    startOfWeek.setHours(0,0,0,0);
    
    const endOfWeek = new Date(now);
    endOfWeek.setDate(now.getDate() - now.getDay() + 6); // Go forward to Saturday
    endOfWeek.setHours(23,59,59,999);

    // A. Count Physical Visits (Attendance)
    const visitsThisWeek = await Attendance.count({
      where: {
        member_id: userId,
        attendance_date: { [Op.between]: [startOfWeek, endOfWeek] },
        status: { [Op.ne]: 'ABSENT' } // Only count actual visits
      }
    });

    // B. Count Class Bookings (Confirmed)
    const bookingsThisWeek = await ClassBooking.count({
      where: {
          user_id: userId,
          status: 'CONFIRMED',
          booking_date: { [Op.between]: [startOfWeek, endOfWeek] }
      }
    });

    // C. Validate Total Usage
    const totalUsage = visitsThisWeek + bookingsThisWeek;

    if (totalUsage >= plan.visit_limit_per_week) {
      return { 
        valid: false, 
        message: `Weekly limit reached (${plan.visit_limit_per_week} visits/week). You have used ${visitsThisWeek} visits and ${bookingsThisWeek} class bookings.` 
      };
    }
  }

  return { valid: true };
};

// 1. MANUAL CHECK-IN / CHECK-OUT (Admin)
exports.markAttendance = async (req, res) => {
  try {
    const { member_code } = req.body;
    if (!member_code) return res.status(400).json({ message: "Member ID is required" });

    const user = await User.findOne({ where: { member_code } });
    if (!user) return res.status(404).json({ message: "Member not found." });

    const today = new Date().toISOString().split('T')[0];
    const nowTime = new Date().toLocaleTimeString('en-GB', { hour12: false });
    
    // Check if a record exists for today
    const existingEntry = await Attendance.findOne({ 
      where: { member_id: user.user_id, attendance_date: today } 
    });

    // --- CHECK OUT LOGIC ---
    if (existingEntry) {
      // If already checked out, stop
      if (existingEntry.check_out) {
        return res.status(400).json({ message: "Member already checked out today." });
      }

      // Perform Check Out
      const duration = calculateDuration(existingEntry.check_in, nowTime);
      
      await existingEntry.update({
        check_out: nowTime,
        duration: duration,
        status: 'CHECKED_OUT'
      });

      return res.status(200).json({ 
        message: `Check-out Successful! Duration: ${duration} mins`, 
        member: user.name 
      });
    }

    // --- VALIDATION: ONLY RUN BEFORE CHECK-IN ---
    // This validates time and visit limits against the ACTIVE plan
    const validation = await validateEntry(user.user_id);
    if (!validation.valid) {
      return res.status(403).json({ message: validation.message });
    }

    // --- CHECK IN LOGIC ---
    await Attendance.create({
      member_id: user.user_id,
      attendance_date: today,
      check_in: nowTime,
      status: 'PRESENT'
    });

    res.status(201).json({ message: "Check-in Successful!", member: user.name });

  } catch (err) {
    console.error("Attendance Error:", err);
    res.status(500).json({ error: err.message });
  }
};

// 2. GENERATE QR DATA (Admin)
exports.getDailyQRPayload = (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const secret = "ROYAL_GYM_SECRET"; 
    const hash = crypto.createHash('sha256').update(today + secret).digest('hex');
    
    const qrPayload = JSON.stringify({ date: today, token: hash });
    res.json({ payload: qrPayload });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 3. GET TODAY'S LIST (Admin)
exports.getTodayAttendance = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const records = await Attendance.findAll({
      where: { attendance_date: today },
      include: [{ model: User, attributes: ['name', 'member_code'] }],
      order: [['check_in', 'DESC']]
    });
    res.json(records);
  } catch (err) {
    console.error("Fetch Error:", err);
    res.status(500).json({ error: err.message });
  }
};

// 4. GET MY ATTENDANCE HISTORY (Member)
exports.getMyAttendance = async (req, res) => {
  try {
    const userId = req.user.id;
    const history = await Attendance.findAll({
      where: { member_id: userId },
      order: [['attendance_date', 'DESC'], ['check_in', 'DESC']]
    });
    res.json(history);
  } catch (err) {
    console.error("History Error:", err);
    res.status(500).json({ error: err.message });
  }
};

// 5. MEMBER SCAN QR (Member)
exports.markAttendanceByQR = async (req, res) => {
  try {
    const { scanned_data } = req.body;
    const userId = req.user.id; 

    if (!scanned_data) return res.status(400).json({ message: "No QR data found" });

    let payload;
    try {
      payload = JSON.parse(scanned_data);
    } catch (e) {
      return res.status(400).json({ message: "Invalid QR Code Format" });
    }

    const { date, token } = payload;
    const today = new Date().toISOString().split('T')[0];

    // Security Checks
    if (date !== today) {
      return res.status(400).json({ message: "This QR Code has expired. Please scan today's code." });
    }
    const secret = "ROYAL_GYM_SECRET"; 
    const expectedHash = crypto.createHash('sha256').update(today + secret).digest('hex');
    if (token !== expectedHash) {
      return res.status(400).json({ message: "Security Check Failed. Invalid QR." });
    }

    const nowTime = new Date().toLocaleTimeString('en-GB', { hour12: false });

    // Check existing entry
    const existingEntry = await Attendance.findOne({ 
      where: { member_id: userId, attendance_date: today } 
    });

    // --- CHECK OUT LOGIC (QR) ---
    if (existingEntry) {
      if (existingEntry.check_out) {
        return res.status(400).json({ message: "You have already checked out today!" });
      }

      const duration = calculateDuration(existingEntry.check_in, nowTime);

      await existingEntry.update({
        check_out: nowTime,
        duration: duration,
        status: 'CHECKED_OUT'
      });

      return res.json({ message: `Goodbye! Session: ${duration} mins.` });
    }

    // --- VALIDATION: ONLY RUN BEFORE CHECK-IN ---
    const validation = await validateEntry(userId);
    if (!validation.valid) {
      return res.status(403).json({ message: validation.message });
    }

    // --- CHECK IN LOGIC (QR) ---
    await Attendance.create({
      member_id: userId,
      attendance_date: today,
      check_in: nowTime,
      status: 'PRESENT'
    });

    res.json({ message: "Check-in Successful! Welcome to Royal Fitness." });

  } catch (err) {
    console.error("QR Scan Error:", err);
    res.status(500).json({ error: "Scan processing failed." });
  }
};