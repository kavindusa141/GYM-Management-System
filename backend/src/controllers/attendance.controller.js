const Attendance = require("../models/Attendance");
const User = require("../models/User");
const crypto = require("crypto"); 
const { Op } = require("sequelize");

// 1. MANUAL CHECK-IN (Admin)
exports.markAttendance = async (req, res) => {
  try {
    const { member_code } = req.body;
    if (!member_code) return res.status(400).json({ message: "Member ID is required" });

    const user = await User.findOne({ where: { member_code } });
    if (!user) return res.status(404).json({ message: "Member not found." });

    const today = new Date().toISOString().split('T')[0];
    
    const existingEntry = await Attendance.findOne({ 
      where: { member_id: user.user_id, attendance_date: today } 
    });

    if (existingEntry) return res.status(400).json({ message: "Already checked in today." });

    await Attendance.create({
      member_id: user.user_id,
      attendance_date: today,
      check_in: new Date().toLocaleTimeString('en-GB', { hour12: false }),
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

// 4. GET MY ATTENDANCE HISTORY (Member) -- [THIS WAS MISSING]
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

    if (date !== today) {
      return res.status(400).json({ message: "This QR Code has expired. Please scan today's code." });
    }

    const secret = "ROYAL_GYM_SECRET"; 
    const expectedHash = crypto.createHash('sha256').update(today + secret).digest('hex');

    if (token !== expectedHash) {
      return res.status(400).json({ message: "Security Check Failed. Invalid QR." });
    }

    const existingEntry = await Attendance.findOne({ 
      where: { member_id: userId, attendance_date: today } 
    });

    if (existingEntry) {
      return res.status(400).json({ message: "You are already checked in for today!" });
    }

    await Attendance.create({
      member_id: userId,
      attendance_date: today,
      check_in: new Date().toLocaleTimeString('en-GB', { hour12: false }), 
      status: 'PRESENT'
    });

    res.json({ message: "Check-in Successful! Welcome to Royal Fitness." });
  } catch (err) {
    console.error("QR Scan Error:", err);
    res.status(500).json({ error: "Scan processing failed." });
  }
};