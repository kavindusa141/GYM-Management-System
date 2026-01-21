const MembershipPlan = require("../models/MembershipPlan");

// 1. Create a Plan (Admin Only)
exports.createPlan = async (req, res) => {
  try {
    const { name, price, duration_months, description, features } = req.body;
    const plan = await MembershipPlan.create({
      name, 
      price, 
      duration_months, 
      description, 
      features 
    });
    res.status(201).json({ message: "Membership Plan created!", plan });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 2. Get All Active Plans (Public/Members/Admins)
exports.getAllPlans = async (req, res) => {
  try {
    const plans = await MembershipPlan.findAll({ 
      where: { status: 'ACTIVE' },
      order: [['price', 'ASC']] // Show cheapest first
    });
    res.json(plans);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 3. Get Single Plan Details
exports.getPlanById = async (req, res) => {
  try {
    const plan = await MembershipPlan.findByPk(req.params.id);
    if (!plan) return res.status(404).json({ error: "Plan not found" });
    res.json(plan);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 4. Delete/Deactivate Plan (Admin Only)
exports.deletePlan = async (req, res) => {
  try {
    await MembershipPlan.update({ status: 'INACTIVE' }, { where: { plan_id: req.params.id } });
    res.json({ message: "Plan deactivated successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// NEW: Update Plan
exports.updatePlan = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, duration_months, description, features } = req.body;
    
    // Find and Update
    const plan = await MembershipPlan.findByPk(id);
    if (!plan) return res.status(404).json({ message: "Plan not found" });

    await plan.update({
      name, 
      price, 
      duration_months, 
      description, 
      features 
    });

    res.json({ message: "Plan Updated Successfully", plan });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};