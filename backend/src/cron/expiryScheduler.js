const cron = require('node-cron');
const { Op } = require('sequelize');
const UserSubscription = require('../models/UserSubscription');
const MemberAssignment = require('../models/MemberAssignment');

const startExpiryScheduler = () => {
    // Run every day at midnight: '0 0 * * *'
    cron.schedule('0 0 * * *', async () => {
        console.log('⏳ Running Daily Expiry Check...');
        try {
            const today = new Date();
            // Members are given 2 days grace period.
            // So we look for subscriptions expired BEFORE (today - 2 days)
            const cutoffDate = new Date(today);
            cutoffDate.setDate(today.getDate() - 2);
            const cutoffDateString = cutoffDate.toISOString().split('T')[0];

            // 1. Find Expired Subscriptions (older than 2 days)
            // We need to fetch subscriptions that are strictly expired based on date,
            // regardless of whether their status is already 'EXPIRED' or still 'ACTIVE'.
            const expiredSubs = await UserSubscription.findAll({
                where: {
                    end_date: { [Op.lt]: cutoffDateString }, // End date is BEFORE 2 days ago
                    // We don't necessarily filter by status because even if it says ACTIVE,
                    // if the date is passed, it's expired.
                },
                attributes: ['user_id']
            });

            if (expiredSubs.length === 0) {
                console.log('✅ No expired members found needing removal.');
                return;
            }

            const expiredUserIds = expiredSubs.map(sub => sub.user_id);

            // 2. Deactivate Trainer Assignments for these users
            const result = await MemberAssignment.update(
                { status: 'INACTIVE' },
                {
                    where: {
                        member_id: { [Op.in]: expiredUserIds },
                        status: 'ACTIVE'
                    }
                }
            );

            // 3. Mark the Subscription as EXPIRED if not already (Optional cleanup)
            await UserSubscription.update(
                { status: 'EXPIRED' },
                {
                    where: {
                        user_id: { [Op.in]: expiredUserIds },
                        status: 'ACTIVE'
                    }
                }
            );

            if (result[0] > 0) {
                console.log(`⚠️ Removed trainer assignments for ${result[0]} members due to expired subscription > 2 days.`);
            } else {
                console.log('✅ No active assignments needed removal.');
            }

        } catch (error) {
            console.error('❌ Error in Expiry Scheduler:', error);
        }
    });

    console.log('🕒 Expiry Scheduler Initialized (Runs daily at 00:00)');
};

module.exports = startExpiryScheduler;
