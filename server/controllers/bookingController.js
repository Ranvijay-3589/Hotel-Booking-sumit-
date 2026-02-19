const { validationResult } = require('express-validator');
const { Booking, Room, Hotel } = require('../models');
const { Op } = require('sequelize');

// POST /api/bookings - Create a booking
const createBooking = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: errors.array()[0].msg });
    }

    const { roomId, checkIn, checkOut, guests } = req.body;
    const userId = req.user.id;

    // Validate room exists
    const room = await Room.findByPk(roomId, {
      include: [{ model: Hotel, as: 'hotel' }],
    });

    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    if (!room.available) {
      return res.status(400).json({ message: 'Room is not available' });
    }

    // Validate guests don't exceed capacity
    if (guests > room.capacity) {
      return res.status(400).json({
        message: `Room capacity is ${room.capacity} guests`,
      });
    }

    // Validate dates
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (checkInDate < today) {
      return res.status(400).json({ message: 'Check-in date cannot be in the past' });
    }

    if (checkOutDate <= checkInDate) {
      return res.status(400).json({ message: 'Check-out must be after check-in' });
    }

    // Check for conflicting bookings
    const conflicting = await Booking.findOne({
      where: {
        roomId,
        status: 'confirmed',
        [Op.or]: [
          {
            checkIn: { [Op.between]: [checkIn, checkOut] },
          },
          {
            checkOut: { [Op.between]: [checkIn, checkOut] },
          },
          {
            [Op.and]: [
              { checkIn: { [Op.lte]: checkIn } },
              { checkOut: { [Op.gte]: checkOut } },
            ],
          },
        ],
      },
    });

    if (conflicting) {
      return res.status(400).json({ message: 'Room is already booked for the selected dates' });
    }

    // Calculate total price
    const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
    const totalPrice = (parseFloat(room.price) * nights).toFixed(2);

    const booking = await Booking.create({
      userId,
      roomId,
      hotelId: room.hotel.id,
      checkIn,
      checkOut,
      guests,
      totalPrice,
    });

    // Fetch complete booking with associations
    const fullBooking = await Booking.findByPk(booking.id, {
      include: [
        { model: Room, as: 'room' },
        { model: Hotel, as: 'hotel' },
      ],
    });

    res.status(201).json({ booking: fullBooking });
  } catch (error) {
    console.error('CreateBooking error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/bookings/my - Get current user's bookings
const getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.findAll({
      where: { userId: req.user.id },
      include: [
        { model: Room, as: 'room' },
        { model: Hotel, as: 'hotel' },
      ],
      order: [['createdAt', 'DESC']],
    });

    res.json({ bookings });
  } catch (error) {
    console.error('GetMyBookings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { createBooking, getMyBookings };
