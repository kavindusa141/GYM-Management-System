const GymClass = require("../models/GymClass");
const User = require("../models/User");

// 1. Create a Class
exports.createClass = async (req, res) => {
  try {
    const { name, trainer_id, day_of_week, start_time, duration, capacity } = req.body;

    if (!name || !trainer_id || !day_of_week || !start_time) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const newClass = await GymClass.create({
      name,
      trainer_id,
      day_of_week,
      start_time,
      duration,
      capacity,
      status: 'SCHEDULED'
    });

    res.status(201).json({ message: "Class scheduled successfully", newClass });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 2. Get All Classes
exports.getAllClasses = async (req, res) => {
  try {
    const classes = await GymClass.findAll({
      include: [
        { 
          model: User, 
          as: 'Trainer', 
          attributes: ['name', 'user_id', 'member_code'] 
        }
      ],
      order: [
        ['day_of_week', 'ASC'], 
        ['start_time', 'ASC']
      ]
    });
    res.json(classes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 3. Update Class (NEW)
exports.updateClass = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, trainer_id, day_of_week, start_time, duration, capacity } = req.body;

    const cls = await GymClass.findByPk(id);
    if (!cls) return res.status(404).json({ message: "Class not found" });

    // Update fields
    await cls.update({
      name,
      trainer_id,
      day_of_week,
      start_time,
      duration,
      capacity
    });

    res.json({ message: "Class updated successfully", cls });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 4. Delete Class
exports.deleteClass = async (req, res) => {
  try {
    await GymClass.destroy({ where: { class_id: req.params.id } });
    res.json({ message: "Class removed" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 5. Get Trainer Classes
exports.getTrainerClasses = async (req, res) => {
  try {
    const classes = await GymClass.findAll({
      where: { trainer_id: req.user.id },
      order: [['day_of_week', 'ASC'], ['start_time', 'ASC']]
    });
    res.json(classes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 6. Cancel Class by Trainer
exports.cancelClassByTrainer = async (req, res) => {
  try {
    const { id } = req.params;
    const cls = await GymClass.findOne({ 
      where: { class_id: id, trainer_id: req.user.id } 
    });

    if (!cls) return res.status(404).json({ message: "Class not found or not assigned to you." });

    cls.status = 'CANCELLED';
    await cls.save();

    res.json({ message: "Class cancelled successfully." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};