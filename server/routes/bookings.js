const express = require('express');
const { body } = require('express-validator');
const { Op } = require('sequelize');
const { Booking, Room, Hotel } = require('../models');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

// POST /api/bookings - Create a booking
router.post(
  '/',
  auth,
  [
    body('room_id').isInt({ min: 1 }).withMessage('Valid room ID is required'),
    body('check_in').isDate().withMessage('Valid check-in date is required'),
    body('check_out').isDate().withMessage('Valid check-out date is required')
  ],
  validate,
  async (req, res) => {
    try {
      const { room_id, check_in, check_out } = req.body;

      // Validate dates
      const checkInDate = new Date(check_in);
      const checkOutDate = new Date(check_out);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (checkInDate < today) {
        return res.status(400).json({ message: 'Check-in date cannot be in the past' });
      }
      if (checkOutDate <= checkInDate) {
        return res.status(400).json({ message: 'Check-out date must be after check-in date' });
      }

      // Check room exists
      const room = await Room.findByPk(room_id, {
        include: [{ model: Hotel, as: 'hotel' }]
      });
      if (!room) {
        return res.status(404).json({ message: 'Room not found' });
      }
      if (!room.available) {
        return res.status(400).json({ message: 'Room is not available' });
      }

      // Check for overlapping bookings
      const overlapping = await Booking.findOne({
        where: {
          room_id,
          status: 'confirmed',
          [Op.or]: [
            {
              check_in: { [Op.between]: [check_in, check_out] }
            },
            {
              check_out: { [Op.between]: [check_in, check_out] }
            },
            {
              [Op.and]: [
                { check_in: { [Op.lte]: check_in } },
                { check_out: { [Op.gte]: check_out } }
              ]
            }
          ]
        }
      });

      if (overlapping) {
        return res.status(400).json({ message: 'Room is already booked for the selected dates' });
      }

      // Calculate total price
      const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
      const total_price = (parseFloat(room.price_per_night) * nights).toFixed(2);

      const booking = await Booking.create({
        user_id: req.user.id,
        room_id,
        check_in,
        check_out,
        total_price,
        status: 'confirmed'
      });

      // Reload with associations
      const fullBooking = await Booking.findByPk(booking.id, {
        include: [{
          model: Room,
          as: 'room',
          include: [{ model: Hotel, as: 'hotel' }]
        }]
      });

      res.status(201).json({
        message: 'Booking confirmed',
        booking: fullBooking
      });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
);

// GET /api/bookings/my - Get user's bookings
router.get('/my', auth, async (req, res) => {
  try {
    const bookings = await Booking.findAll({
      where: { user_id: req.user.id },
      include: [{
        model: Room,
        as: 'room',
        include: [{ model: Hotel, as: 'hotel' }]
      }],
      order: [['created_at', 'DESC']]
    });

    res.json({ bookings });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
