const GymClass = require("../models/GymClass");
const User = require("../models/User");
const ClassBooking = require("../models/ClassBooking");
const { Op } = require("sequelize");

const TrainerAvailability = require("../models/TrainerAvailability");

// HELPER: Check if trainer is available (no time conflicts AND has availability slot)
const checkTrainerAvailability = async (trainer_id, class_date, start_time, end_time, excludeClassId = null) => {
  if (!trainer_id) return { available: true }; // No trainer assigned

  // 1. Check for overlapping classes (Existing Logic)
  const whereClause = {
    trainer_id,
    class_date, // Ensures we check the specific date
    status: { [Op.ne]: 'CANCELLED' }, // Ignore cancelled classes
    start_time: { [Op.lt]: end_time },    // New class starts before existing ends
    end_time: { [Op.gt]: start_time }     // New class ends after existing starts
  };

  // Exclude current class when editing
  if (excludeClassId) {
    whereClause.class_id = { [Op.ne]: excludeClassId };
  }

  const conflict = await GymClass.findOne({ where: whereClause });

  if (conflict) {
    return {
      available: false,
      conflictTime: `${conflict.start_time.substring(0, 5)} - ${conflict.end_time.substring(0, 5)}`,
      conflictClass: conflict.title,
      reason: 'conflict'
    };
  }

  // 2. Check Trainer's Defined Availability (New Logic)
  // Extract the hour from start_time (e.g. "09:00:00" -> 9)
  const startHour = parseInt(start_time.split(':')[0], 10);

  // Find availability record for this specific date
  const availabilityRecord = await TrainerAvailability.findOne({
    where: {
      trainer_id,
      date: class_date
    }
  });

  // If no record found for this date, trainer is UNAVAILABLE
  if (!availabilityRecord) {
    return {
      available: false,
      reason: 'no_schedule',
      message: 'Trainer has not set any availability for this date.'
    };
  }

  // Check if the specific hour is in the slots array
  // slots is stored as JSON array of integers: [9, 10, 14]
  const slots = availabilityRecord.slots || [];
  if (!slots.includes(startHour)) {
    return {
      available: false,
      reason: 'slot_missing',
      message: `Trainer has not marked ${startHour}:00 as available.`
    };
  }

  return { available: true };
};

// 1. Create Class
exports.createClass = async (req, res) => {
  try {
    const { title, description, trainer_id, class_date, start_time, end_time, capacity } = req.body;

    if (!title || !class_date || !start_time || !end_time) {
      return res.status(400).json({ message: "Title, Date, Start & End Time are required." });
    }

    // Date Validation
    const selectedDate = new Date(class_date).setHours(0, 0, 0, 0);
    const today = new Date().setHours(0, 0, 0, 0);
    if (selectedDate < today) {
      return res.status(400).json({ message: "Cannot schedule classes in the past." });
    }

    // Trainer Availability Check
    if (trainer_id) {
      const availability = await checkTrainerAvailability(trainer_id, class_date, start_time, end_time);
      if (!availability.available) {
        let message = '';
        if (availability.reason === 'conflict') {
          message = `Trainer has a conflicting class from ${availability.conflictTime} (${availability.conflictClass}).`;
        } else if (availability.reason === 'no_schedule') {
          message = `Trainer has not set any availability for this date.`;
        } else if (availability.reason === 'slot_missing') {
          message = `Trainer is not available at this time (Slot not marked).`;
        } else {
          message = availability.message || 'Trainer is not available.';
        }

        return res.status(409).json({ message });
      }
    }

    const newClass = await GymClass.create({
      title,
      description,
      trainer_id: trainer_id || null,
      class_date,
      start_time,
      end_time,
      capacity: capacity || 20,
      status: 'SCHEDULED'
    });

    res.status(201).json({ message: "Class scheduled successfully", class: newClass });
  } catch (err) {
    console.error("Create Class Error:", err);
    res.status(500).json({ error: err.message });
  }
};

// 2. Get All Classes (With Booking Counts)
exports.getAllClasses = async (req, res) => {
  try {
    const classes = await GymClass.findAll({
      include: [
        { model: User, as: 'Trainer', attributes: ['name', 'user_id', 'member_code'] },
        {
          model: ClassBooking,
          include: [{ model: User, attributes: ['name', 'email', 'member_code', 'phone'] }]
        }
      ],
      order: [['class_date', 'ASC'], ['start_time', 'ASC']]
    });

    // Add booking counts and timing info
    const formatted = classes.map(cls => {
      try {
        // FIX: Only count bookings that are NOT cancelled
        const activeBookings = cls.ClassBookings
          ? cls.ClassBookings.filter(b => b.status !== 'CANCELLED')
          : [];

        const bookingCount = activeBookings.length;
        const now = new Date();

        // Convert date to string format (handle both Date objects and strings)
        const dateStr = typeof cls.class_date === 'string'
          ? cls.class_date
          : new Date(cls.class_date).toISOString().split('T')[0];

        // Convert time values to string format (handle both Time objects and strings)
        const startTimeStr = typeof cls.start_time === 'string'
          ? cls.start_time
          : cls.start_time?.toString?.() || '00:00:00';

        const endTimeStr = typeof cls.end_time === 'string'
          ? cls.end_time
          : cls.end_time?.toString?.() || '00:00:00';

        const classStart = new Date(`${dateStr}T${startTimeStr}`);
        const classEnd = new Date(`${dateStr}T${endTimeStr}`);

        // Check for invalid dates
        if (isNaN(classStart.getTime()) || isNaN(classEnd.getTime())) {
          console.error(`Invalid date for class ${cls.class_id}:`, {
            dateStr, startTimeStr, endTimeStr
          });
          throw new Error(`Invalid date/time for class ${cls.class_id}`);
        }

        const hoursUntilStart = (classStart - now) / (1000 * 60 * 60);
        const hasEnded = classEnd < now;
        const hasStarted = classStart < now;

        return {
          ...cls.toJSON(),
          booking_count: bookingCount,
          is_full: bookingCount >= cls.capacity,
          hours_until_start: Math.round(hoursUntilStart),
          can_cancel_12h: hoursUntilStart >= 12 && !hasStarted && cls.status === 'SCHEDULED',
          can_restore_12h: hoursUntilStart >= 12 && !hasStarted && cls.status === 'CANCELLED',
          can_mark_complete: hasEnded && cls.status === 'SCHEDULED',
          class_has_started: hasStarted,
          class_has_ended: hasEnded
        };
      } catch (mapErr) {
        console.error(`Error processing class ${cls?.class_id}:`, mapErr.message);
        throw mapErr;
      }
    });

    res.json(formatted);
  } catch (err) {
    console.error("Get Classes Error:", err);
    res.status(500).json({ error: err.message });
  }
};

// 3. Update Class Details (Edit Info) - Admin & Staff Only
exports.updateClass = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, trainer_id, class_date, start_time, end_time, capacity } = req.body;

    const cls = await GymClass.findByPk(id);
    if (!cls) {
      return res.status(404).json({ message: "Class not found" });
    }

    // Trainer Availability Check (only if trainer changed or time changed)
    if (trainer_id && (trainer_id !== cls.trainer_id || class_date !== cls.class_date || start_time !== cls.start_time || end_time !== cls.end_time)) {
      const availability = await checkTrainerAvailability(trainer_id, class_date, start_time, end_time, id);
      if (!availability.available) {
        let message = '';
        if (availability.reason === 'conflict') {
          message = `Trainer has a conflicting class from ${availability.conflictTime} (${availability.conflictClass}).`;
        } else if (availability.reason === 'no_schedule') {
          message = `Trainer has not set any availability for this date.`;
        } else if (availability.reason === 'slot_missing') {
          message = `Trainer is not available at this time (Slot not marked).`;
        } else {
          message = availability.message || 'Trainer is not available.';
        }
        return res.status(409).json({ message });
      }
    }

    await GymClass.update({
      title, description, trainer_id: trainer_id || null, class_date, start_time, end_time, capacity
    }, { where: { class_id: id } });

    res.json({ message: "Class updated successfully" });
  } catch (err) {
    console.error("Update Class Error:", err);
    res.status(500).json({ error: err.message });
  }
};

// 4. Update Status (Cancel / Complete / Restore) - Admin, Staff, Trainer
exports.updateClassStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Validate status
    if (!['SCHEDULED', 'COMPLETED', 'CANCELLED'].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const cls = await GymClass.findByPk(id, {
      include: [{ model: User, as: 'Trainer', attributes: ['name', 'user_id'] }]
    });
    if (!cls) {
      return res.status(404).json({ message: "Class not found" });
    }

    const now = new Date();
    const dateStr = typeof cls.class_date === 'string'
      ? cls.class_date
      : new Date(cls.class_date).toISOString().split('T')[0];

    const startTimeStr = typeof cls.start_time === 'string'
      ? cls.start_time
      : cls.start_time?.toString?.() || '00:00:00';

    const endTimeStr = typeof cls.end_time === 'string'
      ? cls.end_time
      : cls.end_time?.toString?.() || '00:00:00';

    const classStart = new Date(`${dateStr}T${startTimeStr}`);
    const classEnd = new Date(`${dateStr}T${endTimeStr}`);
    const timeUntilStart = (classStart - now) / (1000 * 60 * 60); // Hours until class starts

    // ============================================================
    // GLOBAL CHECK: COMPLETION TIME (Applies to Admin, Staff, Trainer)
    // ============================================================
    if (status === 'COMPLETED') {
      if (classEnd > now) {
        const hoursUntilEnd = (classEnd - now) / (1000 * 60 * 60);
        return res.status(400).json({
          message: `Cannot mark complete: Class ends in ${Math.round(hoursUntilEnd)} hours. Mark as complete only after class ends.`
        });
      }
      if (cls.status !== 'SCHEDULED') {
        return res.status(400).json({
          message: `Cannot mark complete: Class is already ${cls.status.toLowerCase()}.`
        });
      }
    }

    // ============================================================
    // PERMISSION CHECKS (Trainer Specific)
    // ============================================================
    if (req.user.role === 'TRAINER') {
      // Trainers can only modify their own classes
      if (cls.trainer_id !== req.user.id) {
        return res.status(403).json({ message: "You can only manage your own classes." });
      }

      // CANCEL - Only allowed if at least 12 hours before start time
      if (status === 'CANCELLED') {
        if (classStart <= now) {
          return res.status(400).json({
            message: "Cannot cancel: Class has already started."
          });
        }
        if (timeUntilStart < 12) {
          return res.status(400).json({
            message: `Cannot cancel: Class starts in ${Math.round(timeUntilStart)} hours. Must cancel at least 12 hours before class time.`
          });
        }
      }

      // RESTORE - Only allowed if at least 12 hours before start time
      if (status === 'SCHEDULED') {
        if (cls.status !== 'CANCELLED') {
          return res.status(400).json({
            message: `Cannot restore: Class is ${cls.status.toLowerCase()}, not cancelled.`
          });
        }
        if (classStart <= now) {
          return res.status(400).json({
            message: "Cannot restore: Class has already started."
          });
        }
        if (timeUntilStart < 12) {
          return res.status(400).json({
            message: `Cannot restore: Class starts in ${Math.round(timeUntilStart)} hours. Must restore at least 12 hours before class time.`
          });
        }
      }
    }

    // ============================================================
    // UPDATE CLASS STATUS
    // ============================================================
    const updateData = { status };
    if (status === 'CANCELLED') {
      updateData.cancelled_by_id = req.user.id;
      updateData.cancelled_by_name = req.user.name;
      updateData.cancelled_at = new Date();
    }

    const oldStatus = cls.status;
    await cls.update(updateData);

    // ============================================================
    // NEW LOGIC: AUTO-MARK ATTENDANCE ON COMPLETION
    // ============================================================
    if (status === 'COMPLETED') {
      const Attendance = require("../models/Attendance");

      // Find all confirmed bookings for this class
      const confirmedBookings = await ClassBooking.findAll({
        where: { class_id: id, status: 'CONFIRMED' }
      });

      if (confirmedBookings.length > 0) {
        // Extract all user IDs who booked
        const userIds = confirmedBookings.map(b => b.user_id);

        // Find which of these users actually checked into the gym on the class date
        const gymCheckins = await Attendance.findAll({
          where: {
            member_id: { [Op.in]: userIds },
            attendance_date: dateStr, // The date of the class
            status: { [Op.ne]: 'ABSENT' }
          }
        });

        // Create a Set of user IDs who checked in for O(1) lookup
        const checkedInUserIds = new Set(gymCheckins.map(a => a.member_id));

        // Update bookings: if they checked in, mark as ATTENDED. Otherwise, they missed it (leave currently as CONFIRMED or optionally a MISSED status, but we will keep schema stable).
        // Let's just update the ones who attended to be safe.
        const attendeesToUpdate = confirmedBookings.filter(b => checkedInUserIds.has(b.user_id));

        if (attendeesToUpdate.length > 0) {
          const bookingIdsToUpdate = attendeesToUpdate.map(b => b.booking_id);
          await ClassBooking.update(
            { status: 'ATTENDED' },
            { where: { booking_id: { [Op.in]: bookingIdsToUpdate } } }
          );
        }
      }
    }

    // Re-fetch to get updated data
    const updatedClass = await GymClass.findByPk(id, {
      include: [{ model: User, as: 'Trainer', attributes: ['name', 'user_id'] }]
    });

    res.json({
      message: `Class updated from ${oldStatus} to ${status}`,
      class: updatedClass,
      timeInfo: {
        hoursUntilStart: Math.round(timeUntilStart),
        classStart: classStart,
        classEnd: classEnd
      }
    });
  } catch (err) {
    console.error("Status Update Error:", err);
    res.status(500).json({ error: err.message });
  }
};

// 5. Delete Class (Admin & Staff Only)
exports.deleteClass = async (req, res) => {
  try {
    const { id } = req.params;
    const cls = await GymClass.findByPk(id);
    if (!cls) {
      return res.status(404).json({ message: "Class not found" });
    }

    await cls.destroy();
    res.json({ message: "Class deleted successfully" });
  } catch (err) {
    console.error("Delete Class Error:", err);
    res.status(500).json({ error: err.message });
  }
};

// 6. Get Trainer Specific Classes (Upcoming + Past)
exports.getTrainerClasses = async (req, res) => {
  try {
    // FIX: Use req.user.id
    const classes = await GymClass.findAll({
      where: { trainer_id: req.user.id },
      include: [
        { model: User, as: 'Trainer', attributes: ['name', 'user_id'] },
        {
          model: ClassBooking,
          include: [{ model: User, attributes: ['name', 'email', 'member_code', 'phone'] }]
        }
      ],
      order: [['class_date', 'ASC'], ['start_time', 'ASC']]
    });

    const now = new Date();
    const formatted = classes.map(cls => {
      try {
        // FIX: Only count bookings that are NOT cancelled
        const activeBookings = cls.ClassBookings
          ? cls.ClassBookings.filter(b => b.status !== 'CANCELLED')
          : [];

        const bookingCount = activeBookings.length;

        // Convert date to string format (handle both Date objects and strings)
        const dateStr = typeof cls.class_date === 'string'
          ? cls.class_date
          : new Date(cls.class_date).toISOString().split('T')[0];

        // Convert time values to string format (handle both Time objects and strings)
        const startTimeStr = typeof cls.start_time === 'string'
          ? cls.start_time
          : cls.start_time?.toString?.() || '00:00:00';

        const endTimeStr = typeof cls.end_time === 'string'
          ? cls.end_time
          : cls.end_time?.toString?.() || '00:00:00';

        const classStart = new Date(`${dateStr}T${startTimeStr}`);
        const classEnd = new Date(`${dateStr}T${endTimeStr}`);

        // Check for invalid dates
        if (isNaN(classStart.getTime()) || isNaN(classEnd.getTime())) {
          console.error(`Invalid date for trainer class ${cls.class_id}:`, {
            dateStr, startTimeStr, endTimeStr
          });
          throw new Error(`Invalid date/time for class ${cls.class_id}`);
        }

        const hoursUntilStart = (classStart - now) / (1000 * 60 * 60);
        const hasEnded = classEnd < now;
        const hasStarted = classStart < now;

        return {
          ...cls.toJSON(),
          booking_count: bookingCount,
          is_full: bookingCount >= cls.capacity,
          hours_until_start: Math.round(hoursUntilStart),
          can_cancel_12h: hoursUntilStart >= 12 && !hasStarted && cls.status === 'SCHEDULED',
          can_restore_12h: hoursUntilStart >= 12 && !hasStarted && cls.status === 'CANCELLED',
          can_mark_complete: hasEnded && cls.status === 'SCHEDULED',
          class_has_started: hasStarted,
          class_has_ended: hasEnded
        };
      } catch (mapErr) {
        console.error(`Error processing trainer class ${cls?.class_id}:`, mapErr.message);
        throw mapErr;
      }
    });
    res.json(formatted);
  } catch (err) {
    console.error("Get Trainer Classes Error:", err);
    res.status(500).json({ error: err.message });
  }
};