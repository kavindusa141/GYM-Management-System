const cron = require('node-cron');
const { Op } = require('sequelize');
const { UserSubscription, MembershipPlan, GymClass, ClassBooking, User } = require('../models/associations');
const { sendWhatsAppMessage } = require('../services/whatsapp.service');

const startScheduler = () => {
    console.log('⏳ Starting WhatsApp Notification Cron Jobs...');

    // 1. Subscription Expires Tomorrow (Runs every day at 8:00 AM)
    cron.schedule('0 8 * * *', async () => {
        try {
            console.log('🔄 Running Daily Job: Checking for expiring subscriptions...');

            // Calculate tomorrow's date range
            const tomorrowStart = new Date();
            tomorrowStart.setDate(tomorrowStart.getDate() + 1);
            tomorrowStart.setHours(0, 0, 0, 0);

            const tomorrowEnd = new Date(tomorrowStart);
            tomorrowEnd.setHours(23, 59, 59, 999);

            const expiringSubscriptions = await UserSubscription.findAll({
                where: {
                    end_date: {
                        [Op.between]: [tomorrowStart, tomorrowEnd]
                    },
                    status: 'ACTIVE'
                },
                include: [{
                    model: User,
                    attributes: ['user_id', 'name', 'phone']
                }, {
                    model: MembershipPlan,
                    attributes: ['name']
                }]
            });

            for (const sub of expiringSubscriptions) {
                const user = sub.User;
                if (user && user.phone) {
                    const planName = sub.MembershipPlan ? sub.MembershipPlan.name : 'your plan';
                    const message = `🔔 *Gym Reminder*\n\nHi ${user.name.split(' ')[0]}! Your subscription for the ${planName} is expiring tomorrow (${tomorrowStart.toLocaleDateString()}). Please renew your membership soon to avoid any interruption to your training. 💪`;
                    await sendWhatsAppMessage(user.phone, message);
                }
            }

        } catch (error) {
            console.error('❌ Error in daily expiration job:', error);
        }
    });

    // 2. Class Starts in 1 Hour (Runs every 15 minutes to catch upcoming classes)
    cron.schedule('*/15 * * * *', async () => {
        try {
            console.log('🔄 Running 15-Min Job: Checking for upcoming classes...');

            const now = new Date();
            // Target is exactly 1 hour from now
            const targetTime = new Date(now.getTime() + 60 * 60 * 1000);

            // Format dates for SQL DATEONLY and TIME comparisons
            const dateStr = targetTime.toISOString().split('T')[0];

            // Buffer window: Target time +/- 7.5 minutes (since cron runs every 15 mins)
            const minTime = new Date(targetTime.getTime() - 7.5 * 60 * 1000);
            const maxTime = new Date(targetTime.getTime() + 7.5 * 60 * 1000);

            const minTimeStr = minTime.toISOString().split('T')[1].substring(0, 8);
            const maxTimeStr = maxTime.toISOString().split('T')[1].substring(0, 8);

            const upcomingClasses = await GymClass.findAll({
                where: {
                    class_date: dateStr,
                    start_time: {
                        [Op.between]: [minTimeStr, maxTimeStr]
                    },
                    status: 'SCHEDULED'
                },
                include: [{
                    model: ClassBooking,
                    include: [{
                        model: User,
                        attributes: ['user_id', 'name', 'phone']
                    }]
                }]
            });

            for (const gymClass of upcomingClasses) {
                const timeString = gymClass.start_time.substring(0, 5); // "HH:MM"
                for (const booking of gymClass.ClassBookings || []) {
                    const user = booking.User;
                    if (user && user.phone) {
                        const message = `🏋️‍♂️ *Class Reminder*\n\nHi ${user.name.split(' ')[0]}! Just a friendly reminder that your class *${gymClass.title}* starts in 1 hour (at ${timeString}). Get ready to crush it! 🔥`;
                        await sendWhatsAppMessage(user.phone, message);
                    }
                }
            }

        } catch (error) {
            console.error('❌ Error in upcoming class job:', error);
        }
    });
};

module.exports = {
    startScheduler
};
