const User = require('./user');
const Availability = require('./availability');
const Schedule = require('./schedule');

// User - Availability relationship
User.hasMany(Availability, {
  foreignKey: 'userId',
  as: 'availabilities',
});

Availability.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
});

// User - Schedule relationship (for assigned shifts)
User.hasMany(Schedule, {
  foreignKey: 'userId',
  as: 'schedules',
});

Schedule.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
});

// User - Schedule relationship (for admin assignments)
User.hasMany(Schedule, {
  foreignKey: 'assignedBy',
  as: 'assignments',
});

Schedule.belongsTo(User, {
  foreignKey: 'assignedBy',
  as: 'assignedByUser',
});

module.exports = {
  User,
  Availability,
  Schedule,
  sequelize: require('../config/database').sequelize,
}; 