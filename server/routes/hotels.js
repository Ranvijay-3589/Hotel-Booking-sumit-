const express = require('express');
const { Op } = require('sequelize');
const { body } = require('express-validator');
const { Hotel, Room, Booking } = require('../models');
const auth = require('../middleware/auth');
const validate = require('../middleware/validate');

const router = express.Router();

// GET /api/hotels - Search hotels with filters
router.get('/', async (req, res) => {
  try {
    const { location, min_price, max_price, rating, page = 1, limit = 10 } = req.query;

    const hotelWhere = {};
    if (location) {
      hotelWhere[Op.or] = [
        { location: { [Op.iLike]: `%${location}%` } },
        { name: { [Op.iLike]: `%${location}%` } }
      ];
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

// POST /api/hotels - Add a new hotel (authenticated users)
router.post('/',
  auth,
  [
    body('name').trim().notEmpty().withMessage('Hotel name is required'),
    body('location').trim().notEmpty().withMessage('Location is required'),
    body('description').optional().trim(),
    body('rating').optional().isFloat({ min: 0, max: 5 }).withMessage('Rating must be between 0 and 5'),
    body('amenities').optional().isArray().withMessage('Amenities must be an array'),
    body('image_url').optional().trim(),
    body('rooms').optional().isArray().withMessage('Rooms must be an array'),
    body('rooms.*.room_type').optional().trim().notEmpty().withMessage('Room type is required'),
    body('rooms.*.price_per_night').optional().isFloat({ min: 0 }).withMessage('Price must be positive'),
    body('rooms.*.capacity').optional().isInt({ min: 1 }).withMessage('Capacity must be at least 1'),
  ],
  validate,
  async (req, res) => {
    try {
      const { name, location, description, rating, amenities, image_url, rooms } = req.body;

      const hotel = await Hotel.create({
        name,
        location,
        description: description || '',
        rating: rating || 0,
        amenities: amenities || [],
        image_url: image_url || ''
      });

      // Create rooms if provided
      if (rooms && rooms.length > 0) {
        const roomRecords = rooms.map(room => ({
          hotel_id: hotel.id,
          room_type: room.room_type,
          price_per_night: room.price_per_night,
          capacity: room.capacity || 2,
          available: true,
          description: room.description || ''
        }));
        await Room.bulkCreate(roomRecords);
      }

      // Fetch back with rooms included
      const createdHotel = await Hotel.findByPk(hotel.id, {
        include: [{ model: Room, as: 'rooms' }]
      });

      res.status(201).json({ message: 'Hotel added successfully', hotel: createdHotel });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
);

// PUT /api/hotels/:id - Update a hotel (authenticated users)
router.put('/:id',
  auth,
  [
    body('name').optional().trim().notEmpty().withMessage('Hotel name cannot be empty'),
    body('location').optional().trim().notEmpty().withMessage('Location cannot be empty'),
    body('description').optional().trim(),
    body('rating').optional().isFloat({ min: 0, max: 5 }).withMessage('Rating must be between 0 and 5'),
    body('amenities').optional().isArray().withMessage('Amenities must be an array'),
    body('image_url').optional().trim(),
    body('rooms').optional().isArray().withMessage('Rooms must be an array'),
    body('rooms.*.room_type').optional().trim().notEmpty().withMessage('Room type is required'),
    body('rooms.*.price_per_night').optional().isFloat({ min: 0 }).withMessage('Price must be positive'),
    body('rooms.*.capacity').optional().isInt({ min: 1 }).withMessage('Capacity must be at least 1'),
  ],
  validate,
  async (req, res) => {
    try {
      const hotel = await Hotel.findByPk(req.params.id);
      if (!hotel) {
        return res.status(404).json({ message: 'Hotel not found' });
      }

      const { name, location, description, rating, amenities, image_url, rooms } = req.body;

      // Update hotel fields
      await hotel.update({
        ...(name !== undefined && { name }),
        ...(location !== undefined && { location }),
        ...(description !== undefined && { description }),
        ...(rating !== undefined && { rating }),
        ...(amenities !== undefined && { amenities }),
        ...(image_url !== undefined && { image_url })
      });

      // Update rooms if provided
      if (rooms && Array.isArray(rooms)) {
        // Delete existing rooms and recreate
        await Room.destroy({ where: { hotel_id: hotel.id } });
        if (rooms.length > 0) {
          const roomRecords = rooms.map(room => ({
            hotel_id: hotel.id,
            room_type: room.room_type,
            price_per_night: room.price_per_night,
            capacity: room.capacity || 2,
            available: room.available !== undefined ? room.available : true,
            description: room.description || ''
          }));
          await Room.bulkCreate(roomRecords);
        }
      }

      // Fetch updated hotel with rooms
      const updatedHotel = await Hotel.findByPk(hotel.id, {
        include: [{ model: Room, as: 'rooms' }]
      });

      res.json({ message: 'Hotel updated successfully', hotel: updatedHotel });
    } catch (error) {
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
);

// DELETE /api/hotels/:id - Delete a hotel (authenticated users)
router.delete('/:id', auth, async (req, res) => {
  try {
    const hotel = await Hotel.findByPk(req.params.id, {
      include: [{ model: Room, as: 'rooms' }]
    });

    if (!hotel) {
      return res.status(404).json({ message: 'Hotel not found' });
    }

    // Delete associated rooms first
    await Room.destroy({ where: { hotel_id: hotel.id } });

    // Delete the hotel
    await hotel.destroy();

    res.json({ message: 'Hotel deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
