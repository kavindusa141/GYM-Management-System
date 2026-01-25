const WorkoutPlan = require("../models/WorkoutPlan");
const WorkoutExercise = require("../models/WorkoutExercise");
const WorkoutLog = require("../models/WorkoutLog");
const User = require("../models/User");

// 1. Create a Plan
exports.createPlan = async (req, res) => {
  try {
    // Destructure start_date and end_date
    const { member_id, name, description, exercises, start_date, end_date } = req.body;
    
    const newPlan = await WorkoutPlan.create({
      member_id,
      trainer_id: req.user.id,
      name,
      description,
      start_date, // Save Start Date
      end_date    // Save End Date
    });

    if (exercises && exercises.length > 0) {
      const exerciseData = exercises.map(ex => ({
        plan_id: newPlan.plan_id,
        name: ex.name,
        sets: ex.sets || 3,
        reps: ex.reps || '10',
        weight: ex.weight || '',
        notes: ex.notes || ''
      }));
      await WorkoutExercise.bulkCreate(exerciseData);
    }

    res.status(201).json({ message: "Workout Plan Assigned!", planId: newPlan.plan_id });
  } catch (err) {
    console.error("Create Plan Error:", err);
    res.status(500).json({ error: err.message });
  }
};

// 2. Get Trainer's Created Plans (Fixes 'Unknown Client')
exports.getTrainerPlans = async (req, res) => {
  try {
    const plans = await WorkoutPlan.findAll({
      where: { trainer_id: req.user.id },
      include: [
        { 
          model: User, 
          as: 'Member', // MUST MATCH ASSOCIATION in models/index.js (or wherever associations are defined)
          attributes: ['user_id', 'name', 'member_code'] 
        },
        { model: WorkoutExercise }
      ],
      order: [['created_at', 'DESC']]
    });
    res.json(plans);
  } catch (err) {
    console.error("Get Trainer Plans Error:", err);
    res.status(500).json({ error: err.message });
  }
};

// 3. Get Members for Dropdown
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

// 5. Log Workout
exports.logWorkout = async (req, res) => {
  try {
    const { plan_id, duration_mins, notes, mood } = req.body;
    const log = await WorkoutLog.create({
      member_id: req.user.id,
      plan_id,
      duration_mins: duration_mins || 0,
      notes,
      mood,
      date: new Date()
    });
    res.status(201).json({ message: "Logged!", log });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 6. Client Progress
exports.getClientProgress = async (req, res) => {
  try {
    const logs = await WorkoutLog.findAll({
      where: { member_id: req.params.member_id },
      include: [{ model: WorkoutPlan, as: 'Plan', attributes: ['name'] }],
      order: [['date', 'DESC']]
    });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 7. Get Single Plan (For Editing)
exports.getPlanById = async (req, res) => {
  try {
    const plan = await WorkoutPlan.findOne({
      where: { plan_id: req.params.id },
      include: [
        { model: WorkoutExercise },
        { model: User, as: 'Member', attributes: ['user_id', 'name', 'member_code'] }
      ]
    });
    if (!plan) return res.status(404).json({ message: "Plan not found" });
    res.json(plan);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 8. Update Plan
exports.updatePlan = async (req, res) => {
  try {
    const { id } = req.params;
    // Destructure start_date and end_date
    const { member_id, name, description, exercises, start_date, end_date } = req.body;

    await WorkoutPlan.update(
      { member_id, name, description, start_date, end_date }, // Update dates
      { where: { plan_id: id } }
    );

    // ... (Exercise update logic remains the same) ...
    await WorkoutExercise.destroy({ where: { plan_id: id } });
    if (exercises && exercises.length > 0) {
        // ... bulk create logic ...
        const exerciseData = exercises.map(ex => ({
            plan_id: id,
            name: ex.name,
            sets: ex.sets || 3,
            reps: ex.reps || '10',
            weight: ex.weight || '',
            notes: ex.notes || ''
        }));
        await WorkoutExercise.bulkCreate(exerciseData);
    }

    res.json({ message: "Plan updated successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 9. Delete Plan
exports.deletePlan = async (req, res) => {
  try {
    const { id } = req.params;
    await WorkoutExercise.destroy({ where: { plan_id: id } });
    await WorkoutPlan.destroy({ where: { plan_id: id } });
    res.json({ message: "Deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};