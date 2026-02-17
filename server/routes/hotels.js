const express = require('express');
const { Op } = require('sequelize');
const { Hotel, Room, Booking } = require('../models');

const router = express.Router();

// GET /api/hotels - Search hotels with filters
router.get('/', async (req, res) => {
  try {
    const { location, min_price, max_price, rating, page = 1, limit = 10 } = req.query;

    const hotelWhere = {};
    if (location) {
      hotelWhere.location = { [Op.iLike]: `%${location}%` };
    }
    if (rating) {
      hotelWhere.rating = { [Op.gte]: parseFloat(rating) };
    }

    const roomWhere = {};
    if (min_price) {
      roomWhere.price_per_night = { ...roomWhere.price_per_night, [Op.gte]: parseFloat(min_price) };
    }
    if (max_price) {
      roomWhere.price_per_night = { ...roomWhere.price_per_night, [Op.lte]: parseFloat(max_price) };
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows: hotels } = await Hotel.findAndCountAll({
      where: hotelWhere,
      include: [{
        model: Room,
        as: 'rooms',
        where: Object.keys(roomWhere).length > 0 ? roomWhere : undefined,
        required: Object.keys(roomWhere).length > 0
      }],
      distinct: true,
      offset,
      limit: parseInt(limit),
      order: [['rating', 'DESC']]
    });

    res.json({
      hotels,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / parseInt(limit))
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// GET /api/hotels/:id - Get hotel details with rooms and availability
router.get('/:id', async (req, res) => {
  try {
    const hotel = await Hotel.findByPk(req.params.id, {
      include: [{
        model: Room,
        as: 'rooms',
        include: [{
          model: Booking,
          as: 'bookings',
          where: {
            status: 'confirmed',
            check_out: { [Op.gte]: new Date() }
          },
          required: false
        }]
      }]
    });

    if (!hotel) {
      return res.status(404).json({ message: 'Hotel not found' });
    }

    res.json({ hotel });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
