const TrainerAvailability = require("../models/TrainerAvailability");

// 1. Get My Availability
exports.getAvailability = async (req, res) => {
  try {
    const availability = await TrainerAvailability.findAll({
      where: { trainer_id: req.user.id }
    });
    res.json(availability);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 2. Update Availability (Save All Days)
exports.updateAvailability = async (req, res) => {
  try {
    const { schedule } = req.body; // Expects array: [{ day_of_week: 'Monday', slots: [6,7] }, ...]
    const trainer_id = req.user.id;

    // We loop through the incoming schedule and update/create records
    for (const item of schedule) {
      const { day_of_week, slots } = item;

      // Check if record exists
      const existing = await TrainerAvailability.findOne({
        where: { trainer_id, day_of_week }
      });

      if (existing) {
        existing.slots = slots;
        await existing.save();
      } else {
        await TrainerAvailability.create({
          trainer_id,
          day_of_week,
          slots
        });
      }
    }

    res.json({ message: "Availability updated successfully!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};