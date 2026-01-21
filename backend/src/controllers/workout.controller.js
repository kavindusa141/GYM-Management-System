const WorkoutPlan = require("../models/WorkoutPlan");
const WorkoutExercise = require("../models/WorkoutExercise");
const WorkoutLog = require("../models/WorkoutLog");
const User = require("../models/User");

// 1. Create a Plan
exports.createPlan = async (req, res) => {
  try {
    const { member_id, name, description, exercises } = req.body;
    
    // Create the plan header
    const newPlan = await WorkoutPlan.create({
      member_id,
      trainer_id: req.user.id, // Logged in trainer
      name,
      description
    });

    // Create the exercises
    if (exercises && exercises.length > 0) {
      const exerciseData = exercises.map(ex => ({
        plan_id: newPlan.plan_id,
        name: ex.name,
        sets: ex.sets,
        reps: ex.reps,
        weight: ex.weight,
        notes: ex.notes
      }));
      await WorkoutExercise.bulkCreate(exerciseData);
    }

    res.status(201).json({ message: "Workout Plan Assigned!", planId: newPlan.plan_id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 2. Get Trainer's Created Plans
exports.getTrainerPlans = async (req, res) => {
  try {
    const plans = await WorkoutPlan.findAll({
      where: { trainer_id: req.user.id },
      include: [{ model: User, as: 'Member', attributes: ['name'] }],
      order: [['created_at', 'DESC']]
    });
    res.json(plans);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 3. Get Specific List of Members (For Dropdown)
exports.getMembersForTrainer = async (req, res) => {
  try {
    const members = await User.findAll({
      where: { role: 'MEMBER' },
      attributes: ['user_id', 'name', 'member_code'],
      order: [['name', 'ASC']]
    });
    res.json(members);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 4. Get Member's Own Plans
exports.getMyPlans = async (req, res) => {
  try {
    const plans = await WorkoutPlan.findAll({
      where: { member_id: req.user.id, status: 'ACTIVE' },
      include: [
        { model: WorkoutExercise },
        { model: User, as: 'Trainer', attributes: ['name'] }
      ],
      order: [['created_at', 'DESC']]
    });
    res.json(plans);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 5. MEMBER: Log a Completed Workout
exports.logWorkout = async (req, res) => {
  try {
    const { plan_id, duration_mins, notes, mood } = req.body;
    const member_id = req.user.id;

    const log = await WorkoutLog.create({
      member_id,
      plan_id,
      duration_mins,
      notes,
      mood,
      date: new Date()
    });

    res.status(201).json({ message: "Workout logged successfully!", log });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 6. TRAINER: Get Progress for a Specific Client
exports.getClientProgress = async (req, res) => {
  try {
    const { member_id } = req.params;

    const logs = await WorkoutLog.findAll({
      where: { member_id },
      include: [{ model: WorkoutPlan, as: 'Plan', attributes: ['name'] }],
      order: [['date', 'DESC']]
    });

    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};