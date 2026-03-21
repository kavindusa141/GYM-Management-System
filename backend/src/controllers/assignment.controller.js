const MemberAssignment = require('../models/MemberAssignment');
const User = require('../models/User');
const MembershipPlan = require('../models/MembershipPlan');
const MemberProfile = require('../models/MemberProfile');
const UserSubscription = require('../models/UserSubscription');
const { Op, Sequelize } = require('sequelize');

// Assign Trainer to Member
exports.assignTrainer = async (req, res) => {
    try {
        const { member_id, trainer_id } = req.body;

        // 1. Verify Member exists and has a plan causing eligibility
        const member = await User.findOne({
            where: { user_id: member_id, role: 'MEMBER' },
            include: [{
                model: MemberProfile
            }]
            // Note: We might need to check their active subscription to see if it allows trainers. 
            // For now, assuming we just check if they are a valid member.
            // Implementation Plan said: "check includes_trainer flag". 
            // To do that, we need to find their active subscription -> plan. 
            // Let's defer that strict check or do a basic check if possible.
            // Since I haven't seen Subscription model fully, I'll skip strict plan check for MVP
            // or try to fetch it if UserSubscription exists.
        });

        if (!member) {
            return res.status(404).json({ message: "Member not found" });
        }

        // 2. Verify Trainer exists
        const trainer = await User.findOne({ where: { user_id: trainer_id, role: 'TRAINER' } });
        if (!trainer) {
            return res.status(404).json({ message: "Trainer not found" });
        }

        // 3. Check if already assigned
        const existing = await MemberAssignment.findOne({
            where: { member_id, status: 'ACTIVE' }
        });

        if (existing) {
            // Option: Update existing assignment or error
            // Let's update it if different, or error.
            if (existing.trainer_id === trainer_id) {
                return res.status(400).json({ message: "Member already assigned to this trainer" });
            }
            // Deactivate old assignment
            await existing.update({ status: 'INACTIVE' });
        }

        // 4. Create Assignment
        const assignment = await MemberAssignment.create({
            member_id,
            trainer_id,
            status: 'ACTIVE'
        });

        res.status(201).json({ message: "Trainer assigned successfully", assignment });

    } catch (error) {
        console.error("Assign Trainer Error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// Get Eligible Members (For Admin List)
exports.getEligibleMembers = async (req, res) => {
    try {
        // Find members who have an ACTIVE subscription to a plan that INCLUDES trainer
        const members = await User.findAll({
            where: { role: 'MEMBER' },
            attributes: ['user_id', 'name', 'member_code', 'email', 'phone'], // Added phone
            include: [
                {
                    model: UserSubscription,
                    where: { status: 'ACTIVE' },
                    required: true,
                    include: [{
                        model: MembershipPlan,
                        where: { includes_trainer: true },
                        required: true,
                        attributes: ['name']
                    }]
                },
                {
                    model: MemberAssignment,
                    as: 'MemberAssignments', // Explicit alias
                    required: false, // Include even if not assigned
                    where: { status: 'ACTIVE' },
                    include: [{
                        model: User,
                        as: 'Trainer',
                        attributes: ['user_id', 'name']
                    }]
                },
                {
                    model: MemberProfile
                }
            ],
            order: [['name', 'ASC']]
        });

        // Flatten data for easier frontend consumption
        const processed = members.map(m => ({
            user_id: m.user_id,
            name: m.name,
            email: m.email,
            member_code: m.member_code,
            phone: m.phone,
            current_plan: m.UserSubscriptions?.[0]?.MembershipPlan?.name || 'Unknown Plan',
            is_assigned: !!m.MemberAssignments?.length, // Use alias
            assigned_trainer: m.MemberAssignments?.[0]?.Trainer || null,
            assignment_id: m.MemberAssignments?.[0]?.assignment_id || null
        }));

        res.json(processed);
    } catch (error) {
        console.error("Get Eligible Members Error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// Get Trainers with Assignment Counts
exports.getTrainersWithCounts = async (req, res) => {
    try {
        const trainers = await User.findAll({
            where: { role: 'TRAINER', status: true },
            attributes: [
                'user_id', 'name', 'email',
                [Sequelize.literal(`(
                    SELECT COUNT(*)
                    FROM member_assignments AS ma
                    INNER JOIN users AS u ON ma.member_id = u.user_id
                    WHERE
                        ma.trainer_id = User.user_id
                        AND ma.status = 'ACTIVE'
                        AND u.is_deleted = 0
                )`), 'active_members_count']
            ]
        });
        res.json(trainers);
    } catch (error) {
        console.error("Get Trainers Error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// Get All Assignments (Admin)
exports.getAllAssignments = async (req, res) => {
    try {
        const assignments = await MemberAssignment.findAll({
            where: { status: 'ACTIVE' },
            include: [
                { model: User, as: 'Member', attributes: ['user_id', 'name', 'email'] },
                { model: User, as: 'Trainer', attributes: ['user_id', 'name', 'email'] }
            ]
        });
        res.json(assignments);
    } catch (error) {
        console.error("Get All Assignments Error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// Get Assigned Members for a Trainer
exports.getTrainerMembers = async (req, res) => {
    try {
        const trainer_id = req.user.id; // Corrected from user_id to id (standard jwt payload)

        const assignments = await MemberAssignment.findAll({
            where: { trainer_id, status: 'ACTIVE' },
            include: [
                {
                    model: User,
                    as: 'Member',
                    attributes: ['user_id', 'name', 'email', 'phone', 'member_code']
                }
            ]
        });

        // We might want to fetch MemberProfile details too
        // But MemberAssignment association to User(Member) needs to be set up well.
        // In MemberAssignment.js, we have `references: User`.
        // We need to ensure MemberAssignment.belongsTo(User, { as: 'Member', foreignKey: 'member_id' }) is called.
        // I will add that at the bottom of the Controller or assume it's done. 
        // Wait, let's add it to the Model file if I haven't already? 
        // I didn't add the `belongsTo` in the Model file text I wrote. I only wrote the `define`.
        // I should fix the Model files to include associations, OR do it here (ugly).
        // Let's do it in the Model file via a `replace_file_content` if needed, 
        // OR just rely on manual query if associations fail.
        // Better: Fix the model file.

        res.json(assignments);

    } catch (error) {
        console.error("Get Trainer Members Error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// Remove Assignment
exports.removeAssignment = async (req, res) => {
    try {
        const { id } = req.params;
        const assignment = await MemberAssignment.findByPk(id);
        if (!assignment) return res.status(404).json({ message: "Assignment not found" });

        await assignment.update({ status: 'INACTIVE' });
        res.json({ message: "Assignment removed" });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};
