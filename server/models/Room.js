const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Room = sequelize.define('Room', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  hotel_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'hotels',
      key: 'id'
    }
  },
  room_type: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Room type is required' }
    }
  },
  price_per_night: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: { args: [0], msg: 'Price must be a positive number' }
    }
  },
  capacity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 2,
    validate: {
      min: { args: [1], msg: 'Capacity must be at least 1' }
    }
  },
  available: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'rooms',
  timestamps: true,
  underscored: true
});

module.exports = Room;
