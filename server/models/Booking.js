const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Booking = sequelize.define('Booking', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  room_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'rooms',
      key: 'id'
    }
  },
  check_in: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    validate: {
      isDate: { msg: 'Check-in must be a valid date' }
    }
  },
  check_out: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    validate: {
      isDate: { msg: 'Check-out must be a valid date' }
    }
  },
  total_price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('confirmed', 'cancelled', 'completed'),
    allowNull: false,
    defaultValue: 'confirmed'
  }
}, {
  tableName: 'bookings',
  timestamps: true,
  underscored: true
});

module.exports = Booking;
