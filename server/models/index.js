const User = require('./User');
const Hotel = require('./Hotel');
const Room = require('./Room');
const Booking = require('./Booking');

// Associations
Hotel.hasMany(Room, { foreignKey: 'hotel_id', as: 'rooms' });
Room.belongsTo(Hotel, { foreignKey: 'hotel_id', as: 'hotel' });

User.hasMany(Booking, { foreignKey: 'user_id', as: 'bookings' });
Booking.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

Room.hasMany(Booking, { foreignKey: 'room_id', as: 'bookings' });
Booking.belongsTo(Room, { foreignKey: 'room_id', as: 'room' });

Hotel.hasMany(Booking, { foreignKey: 'hotel_id', as: 'bookings' });
Booking.belongsTo(Hotel, { foreignKey: 'hotel_id', as: 'hotel' });

module.exports = { User, Hotel, Room, Booking };
