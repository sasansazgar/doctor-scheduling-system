const { Model, DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

class Availability extends Model {}

Availability.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id',
      },
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    isAvailable: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    shiftType: {
      type: DataTypes.ENUM('day', 'night'),
      allowNull: false,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'Availability',
    indexes: [
      {
        unique: true,
        fields: ['userId', 'date', 'shiftType'],
      },
    ],
  }
);

module.exports = Availability; 