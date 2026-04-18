const sequelize = require('./backend/src/config/db');

async function alterDb() {
  try {
    await sequelize.query('ALTER TABLE gym_classes ADD COLUMN delayed_start_time TIME NULL');
    await sequelize.query('ALTER TABLE gym_classes ADD COLUMN delay_reason VARCHAR(255) NULL');
    console.log("DB altered");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

alterDb();
