const sequelize = require('../config/database');
const User = require('./User');
const Hotel = require('./Hotel');
const Room = require('./Room');
const Booking = require('./Booking');

// Hotel has many Rooms
Hotel.hasMany(Room, { foreignKey: 'hotel_id', as: 'rooms' });
Room.belongsTo(Hotel, { foreignKey: 'hotel_id', as: 'hotel' });

// User has many Bookings
User.hasMany(Booking, { foreignKey: 'user_id', as: 'bookings' });
Booking.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Room has many Bookings
Room.hasMany(Booking, { foreignKey: 'room_id', as: 'bookings' });
Booking.belongsTo(Room, { foreignKey: 'room_id', as: 'room' });

module.exports = {
  sequelize,
  User,
  Hotel,
  Room,
  Booking
};
