const { sequelize, Sequelize } = require('../config/database');

const Booking = sequelize.define('Booking', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  userId: {
    type: Sequelize.INTEGER,
    allowNull: false,
    field: 'user_id',
    references: {
      model: 'users',
      key: 'id',
    },
  },
  roomId: {
    type: Sequelize.INTEGER,
    allowNull: false,
    field: 'room_id',
    references: {
      model: 'rooms',
      key: 'id',
    },
  },
  hotelId: {
    type: Sequelize.INTEGER,
    allowNull: false,
    field: 'hotel_id',
    references: {
      model: 'hotels',
      key: 'id',
    },
  },
  checkIn: {
    type: Sequelize.DATEONLY,
    allowNull: false,
    field: 'check_in',
  },
  checkOut: {
    type: Sequelize.DATEONLY,
    allowNull: false,
    field: 'check_out',
  },
  guests: {
    type: Sequelize.INTEGER,
    allowNull: false,
    defaultValue: 1,
    validate: {
      min: 1,
    },
  },
  totalPrice: {
    type: Sequelize.DECIMAL(10, 2),
    allowNull: false,
    field: 'total_price',
  },
  status: {
    type: Sequelize.STRING(20),
    defaultValue: 'confirmed',
    validate: {
      isIn: [['confirmed', 'cancelled', 'completed']],
    },
  },
}, {
  tableName: 'bookings',
  timestamps: true,
});

module.exports = Booking;
