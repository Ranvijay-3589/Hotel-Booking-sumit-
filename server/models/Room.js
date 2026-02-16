const { sequelize, Sequelize } = require('../config/database');

const Room = sequelize.define('Room', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
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
  type: {
    type: Sequelize.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Room type is required' },
    },
  },
  description: {
    type: Sequelize.TEXT,
    allowNull: true,
  },
  price: {
    type: Sequelize.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: { args: [0], msg: 'Price must be positive' },
    },
  },
  capacity: {
    type: Sequelize.INTEGER,
    allowNull: false,
    defaultValue: 2,
    validate: {
      min: 1,
    },
  },
  totalRooms: {
    type: Sequelize.INTEGER,
    allowNull: false,
    defaultValue: 1,
    field: 'total_rooms',
  },
  available: {
    type: Sequelize.BOOLEAN,
    defaultValue: true,
  },
}, {
  tableName: 'rooms',
  timestamps: true,
});

module.exports = Room;
