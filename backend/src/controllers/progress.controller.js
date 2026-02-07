const ProgressLog = require('../models/ProgressLog');
const User = require('../models/User');
const MemberProfile = require('../models/MemberProfile');

// Create Progress Log
exports.logProgress = async (req, res) => {
    try {
        const { member_id, weight, bmi, body_fat_percentage, measurements, notes } = req.body;
        const trainer_id = req.user.id; // Fixed: Matches JWT payload

        const log = await ProgressLog.create({
            member_id,
            trainer_id,
            weight,
            bmi,
            body_fat_percentage,
            measurements,
            notes,
            date: new Date()
        });

        res.status(201).json({ message: "Progress logged successfully", log });
    } catch (error) {
        console.error("Log Progress Error:", error);
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// Get Member Progress & Profile Stats
exports.getMemberProgress = async (req, res) => {
    try {
        const { memberId } = req.params;

        const logs = await ProgressLog.findAll({
            where: { member_id: memberId },
            order: [['date', 'DESC']],
            include: [
                { model: User, as: 'Trainer', attributes: ['name'] }
            ]
        });

        // Fetch current profile stats for auto-fill
        const profile = await MemberProfile.findOne({
            where: { user_id: memberId },
            attributes: ['weight', 'height', 'bmi']
        });

        res.json({ logs, current_stats: profile });
    } catch (error) {
        console.error("Get Progress Error:", error);
        res.status(500).json({ message: "Server error" });
    }
};
// Update Progress Log
exports.updateProgressLog = async (req, res) => {
    try {
        const { logId } = req.params;
        const { weight, bmi, body_fat_percentage, measurements, notes } = req.body;

        const log = await ProgressLog.findByPk(logId);
        if (!log) return res.status(404).json({ message: "Log not found" });

        // Ensure only the trainer who created it can edit (or Admin)
        if (log.trainer_id !== req.user.id && req.user.role !== 'ADMIN') {
            return res.status(403).json({ message: "Not authorized to edit this log" });
        }

        await log.update({
            weight,
            bmi,
            body_fat_percentage,
            measurements,
            notes
        });

        res.json({ message: "Progress updated", log });
    } catch (error) {
        console.error("Update Progress Error:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// Delete Progress Log
exports.deleteProgressLog = async (req, res) => {
    try {
        const { logId } = req.params;
        const log = await ProgressLog.findByPk(logId);

        if (!log) return res.status(404).json({ message: "Log not found" });

        // Authorization Check
        if (log.trainer_id !== req.user.id && req.user.role !== 'ADMIN') {
            return res.status(403).json({ message: "Not authorized to delete this log" });
        }

        await log.destroy();
        res.json({ message: "Progress deleted" });
    } catch (error) {
        console.error("Delete Progress Error:", error);
        res.status(500).json({ message: "Server error" });
    }
};
