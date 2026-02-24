const sequelize = require('../src/config/db');
const TrainerAvailability = require('../src/models/TrainerAvailability');

const sync = async () => {
    try {
        await sequelize.authenticate();
        console.log('✅ Connected to DB');
        await TrainerAvailability.sync({ force: true });
        console.log('✅ TrainerAvailability table synced (force: true)');
        process.exit(0);
    } catch (error) {
        console.error('❌ Sync failed:', error);
        process.exit(1);
    }
};

sync();
