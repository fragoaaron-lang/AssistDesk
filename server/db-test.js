const sequelize = require('./config/db');

async function test() {
  try {
    await sequelize.authenticate();
    console.log('DB OK');
    process.exit(0);
  } catch (err) {
    console.error('DB ERR', err.message || err);
    process.exit(1);
  }
}

test();
