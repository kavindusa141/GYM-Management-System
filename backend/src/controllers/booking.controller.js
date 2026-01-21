const ClassBooking = require("../models/ClassBooking");
const GymClass = require("../models/GymClass"); // <--- Updated
const User = require("../models/User");
const { Op } = require("sequelize");

// --- HELPER: Get next date for a specific day of week ---
const getNextDate = (dayName) => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const today = new Date();
  const targetDay = days.indexOf(dayName);
  const currentDay = today.getDay();
  
  let daysUntil = targetDay - currentDay;
  if (daysUntil <= 0) {
    daysUntil += 7; // If today is Monday and class is Monday, book NEXT Monday (or today if logic permits)
  }
  
  const nextDate = new Date(today);
  nextDate.setDate(today.getDate() + daysUntil);
  return nextDate.toISOString().split('T')[0]; // Return YYYY-MM-DD
};

// 1. Book a Class
exports.bookClass = async (req, res) => {
  try {
    const { class_id } = req.body;
    const user_id = req.user.id; 

    // A. Check if Class exists
    const gymClass = await GymClass.findByPk(class_id);
    if (!gymClass) return res.status(404).json({ message: "Class not found" });

    // B. Calculate the specific DATE being booked
    const targetDate = getNextDate(gymClass.day_of_week);

    // C. Check Capacity for THAT SPECIFIC DATE
    const currentBookings = await ClassBooking.count({
      where: { 
        class_id, 
        booking_date: targetDate, 
        status: 'CONFIRMED' 
      }
    });

    if (currentBookings >= gymClass.capacity) {
      return res.status(400).json({ message: "Class is full for this week." });
    }

    // D. Check if I already booked THIS WEEK
    const existingBooking = await ClassBooking.findOne({
      where: { 
        class_id, 
        user_id, 
        booking_date: targetDate,
        status: 'CONFIRMED' 
      }
    });

    if (existingBooking) {
      return res.status(400).json({ message: "You already booked this session." });
    }

    // E. Create Booking
    const newBooking = await ClassBooking.create({
      user_id,
      class_id,
      booking_date: targetDate,
      status: 'CONFIRMED'
    });

    res.status(201).json({ 
      message: `Booked for ${targetDate}`, 
      booking: newBooking 
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 2. Cancel Booking
exports.cancelBooking = async (req, res) => {
  try {
    const { booking_id } = req.params;
    const user_id = req.user.id;

    const booking = await ClassBooking.findOne({ where: { booking_id, user_id } });
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    booking.status = 'CANCELLED';
    await booking.save();

    res.json({ message: "Booking cancelled" });
  } catch (err) {
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
        attributes: ['name', 'start_time', 'duration', 'day_of_week'],
        include: [{ model: User, as: 'Trainer', attributes: ['name'] }] // Fetch Trainer Name
      }],
      order: [['booking_date', 'ASC']]
    });

    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};