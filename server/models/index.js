const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const db = {
  sequelize,
  Sequelize: require('sequelize'),
};

db.User = require('./User')(sequelize, DataTypes);
db.PasswordResetToken = require('./PasswordResetToken')(sequelize, DataTypes);
db.Department = require('./Department')(sequelize, DataTypes);
db.Service = require('./Service')(sequelize, DataTypes);
db.Faq = require('./Faq')(sequelize, DataTypes);
db.Ticket = require('./Ticket')(sequelize, DataTypes);
db.TicketUpdate = require('./TicketUpdate')(sequelize, DataTypes);
db.Notification = require('./Notification')(sequelize, DataTypes);
db.Announcement = require('./Announcement')(sequelize, DataTypes);
db.ChatLog = require('./ChatLog')(sequelize, DataTypes);

Object.keys(db).forEach((modelName) => {
  if (db[modelName] && typeof db[modelName].associate === 'function') {
    db[modelName].associate(db);
  }
});

module.exports = db;
