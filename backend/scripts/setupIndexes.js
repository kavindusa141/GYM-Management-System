require('dotenv').config();
const sequelize = require('../src/config/db');

const setupIndexes = async () => {
    console.log("=================================================");
    console.log("🚀 STARTING DATABASE INDEX OPTIMIZATION 🚀");
    console.log("=================================================");

    try {
        await sequelize.authenticate();
        console.log('✅ Connected to Database');

        // Users Table Indexes
        console.log('⚡ Indexing Users table...');
        await sequelize.query('CREATE INDEX idx_users_name ON users(name);', { raw: true }).catch(() => console.log('   - Index idx_users_name already exists.'));
        await sequelize.query('CREATE INDEX idx_users_status ON users(status);', { raw: true }).catch(() => console.log('   - Index idx_users_status already exists.'));
        await sequelize.query('CREATE INDEX idx_users_role ON users(role);', { raw: true }).catch(() => console.log('   - Index idx_users_role already exists.'));
        await sequelize.query('CREATE INDEX idx_users_is_deleted ON users(is_deleted);', { raw: true }).catch(() => console.log('   - Index idx_users_is_deleted already exists.'));

        // Payments Table Indexes
        console.log('⚡ Indexing Payments table...');
        await sequelize.query('CREATE INDEX idx_payments_date ON payments(transaction_date);', { raw: true }).catch(() => console.log('   - Index idx_payments_date already exists.'));
        await sequelize.query('CREATE INDEX idx_payments_status ON payments(status);', { raw: true }).catch(() => console.log('   - Index idx_payments_status already exists.'));

        // Subscriptions Table Indexes
        console.log('⚡ Indexing User Subscriptions table...');
        await sequelize.query('CREATE INDEX idx_subscriptions_status ON user_subscriptions(status);', { raw: true }).catch(() => console.log('   - Index idx_subscriptions_status already exists.'));
        await sequelize.query('CREATE INDEX idx_subscriptions_end_date ON user_subscriptions(end_date);', { raw: true }).catch(() => console.log('   - Index idx_subscriptions_end_date already exists.'));

        console.log("=================================================");
        console.log('✅ INDEX OPTIMIZATION COMPLETE.');
        console.log("=================================================");
        process.exit(0);

    } catch (error) {
        console.error('❌ Index Setup failed:', error);
        process.exit(1);
    }
};

setupIndexes();
