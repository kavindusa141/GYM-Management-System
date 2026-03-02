const TrainerAvailability = require("../models/TrainerAvailability");

// 1. Get My Availability
const { Op } = require("sequelize");

// 1. Get My Availability
exports.getAvailability = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const availability = await TrainerAvailability.findAll({
      where: {
        trainer_id: req.user.user_id,
        date: { [Op.gte]: today }
      },
      order: [['date', 'ASC']]
    });
    res.json(availability);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 2. Update Availability (Save All Days)
exports.updateAvailability = async (req, res) => {
  try {
    const { schedule } = req.body; // Expects array: [{ date: '2024-05-20', slots: [6,7] }, ...]
    const trainer_id = req.user.user_id;

    // We loop through the incoming schedule and upsert records
    for (const item of schedule) {
      const { date, slots } = item;

      // Upsert: Create or Update based on trainer_id and date
      const [record, created] = await TrainerAvailability.findOrCreate({
        where: { trainer_id, date },
        defaults: { slots }
      });

      if (!created) {
        record.slots = slots;
        await record.save();
      }
    }

    res.json({ message: "Availability updated successfully!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 3. Get Specific Trainer Availability (For Admin/Staff/Member)
exports.getTrainerAvailabilityById = async (req, res) => {
  try {
    const { trainerId } = req.params;
    const today = new Date().toISOString().split('T')[0];

    const availability = await TrainerAvailability.findAll({
      where: {
        trainer_id: trainerId,
        date: { [Op.gte]: today }
      },
      order: [['date', 'ASC']]
    });

    res.json(availability);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};