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
      capacity
    });

    res.status(201).json({ message: "Class scheduled successfully", newClass });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 2. Get All Classes (With Trainer Info)
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

// 3. Delete Class
exports.deleteClass = async (req, res) => {
  try {
    await GymClass.destroy({ where: { class_id: req.params.id } });
    res.json({ message: "Class removed" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


