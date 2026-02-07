const WorkoutPlan = require("../models/WorkoutPlan");
const WorkoutExercise = require("../models/WorkoutExercise");
const WorkoutLog = require("../models/WorkoutLog");
const User = require("../models/User");
const UserSubscription = require("../models/UserSubscription"); // Added
const MembershipPlan = require("../models/MembershipPlan");
const MemberAssignment = require("../models/MemberAssignment");     // Added

// 1. Create a Plan
exports.createPlan = async (req, res) => {
  try {
    // Destructure start_date and end_date
    const { member_id, name, description, exercises, start_date, end_date } = req.body;

    // --- NEW VALIDATION START ---

    // If it's a COMMON plan, skip subscription checks
    const isCommon = !member_id;

    if (!isCommon) {
      // Check if the member has an active subscription that allows Personal Trainer
      const sub = await UserSubscription.findOne({
        where: { user_id: member_id, status: 'ACTIVE' },
        include: [{ model: MembershipPlan }]
      });

      if (!sub) {
        return res.status(400).json({ message: "This member does not have an active subscription." });
      }

      // STRICT DATE CHECK (In case status wasn't updated yet)
      const today = new Date().toISOString().split('T')[0];
      if (sub.end_date < today) {
        return res.status(400).json({ message: "Member's subscription has expired." });
      }

      // Check the 'includes_trainer' flag we added to the MembershipPlan model
      if (!sub.MembershipPlan.includes_trainer) {
        return res.status(403).json({
          message: "This member's current package does not include Personal Trainer access."
        });
      }

      // Verify Assignment
      const assignment = await MemberAssignment.findOne({
        where: {
          member_id,
          trainer_id: req.user.id,
          status: 'ACTIVE'
        }
      });

      if (!assignment) {
        return res.status(403).json({ message: "You are not assigned to this member." });
      }
    }
    // --- NEW VALIDATION END ---

    const newPlan = await WorkoutPlan.create({
      member_id: member_id || null,
      trainer_id: req.user.id,
      name,
      description,
      is_common: isCommon,
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

// 2. Get Trainer's Created Plans & Common Plans
exports.getTrainerPlans = async (req, res) => {
  try {
    const { Op } = require("sequelize");
    const plans = await WorkoutPlan.findAll({
      where: {
        [Op.or]: [
          { trainer_id: req.user.id }, // My Created Plans
          { is_common: true }          // All Common Plans
        ]
      },
      include: [
        {
          model: User,
          as: 'Member',
          attributes: ['user_id', 'name', 'member_code'],
          required: false // Force LEFT JOIIN to include Common Plans (where member_id is NULL)
        },
        {
          model: User,
          as: 'Trainer', // Creator
          attributes: ['user_id', 'name', 'member_code'],
          required: false
        },
        {
          model: User,
          as: 'Updater', // Last Updated By
          attributes: ['user_id', 'name', 'member_code'],
          required: false // Fix: Allow plans with no updater (old plans)
        },
        {
          model: WorkoutExercise,
          required: false
        }
      ],
      order: [['updated_at', 'DESC']]
    });
    // Debug log removed
    res.json(plans);
  } catch (err) {
    console.error("Get Trainer Plans Error:", err);
    res.status(500).json({ error: err.message });
  }
};

// 3. Get Members for Dropdown
exports.getMembersForTrainer = async (req, res) => {
  try {
    const assignments = await MemberAssignment.findAll({
      where: { trainer_id: req.user.id, status: 'ACTIVE' },
      include: [{
        model: User,
        as: 'Member',
        attributes: ['user_id', 'name', 'member_code'],
        include: [{
          model: UserSubscription,
          // As User hasMany UserSubscriptions, we get an array. 
          // We want the latest one.
          limit: 1,
          order: [['end_date', 'DESC']],
          attributes: ['status', 'end_date']
        }]
      }]
    });

    // Map to just the user objects with sub status
    const members = assignments.map(a => {
      const m = a.Member.toJSON();
      const sub = m.UserSubscriptions?.[0];
      return {
        ...m,
        subscription_status: sub ? sub.status : 'NO_PLAN',
        subscription_end: sub ? sub.end_date : null
      };
    });

    // Sort manually if needed, or rely on db order
    members.sort((a, b) => a.name.localeCompare(b.name));

    res.json(members);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 4. Get Member's Own Plans
exports.getMyPlans = async (req, res) => {
  try {
    const { Op } = require("sequelize");
    const plans = await WorkoutPlan.findAll({
      where: {
        status: 'ACTIVE',
        [Op.or]: [
          { member_id: req.user.id }, // My Personal Plans
          { is_common: true }         // Common Plans for everyone
        ]
      },
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
        {
          model: User,
          as: 'Member',
          attributes: ['user_id', 'name', 'member_code'],
          required: false // Force LEFT JOIN
        }
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

    // Explicitly handle is_common logic similar to creation
    const isCommon = !member_id;

    await WorkoutPlan.update(
      {
        member_id: member_id || null,
        name,
        description,
        start_date,
        end_date,
        is_common: isCommon,
        updated_by: req.user.id // Track who updated it
      },
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