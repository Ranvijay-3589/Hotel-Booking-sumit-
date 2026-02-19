const { Op } = require('sequelize');
const { Hotel, Room } = require('../models');

// GET /api/hotels - Search hotels with filters
const getHotels = async (req, res) => {
  try {
    const { location, minPrice, maxPrice, rating, search } = req.query;

    const where = {};

    if (location) {
      where.location = { [Op.like]: `%${location}%` };
    }

    if (search) {
      where[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { location: { [Op.like]: `%${search}%` } },
      ];
    }

    if (rating) {
      where.rating = { [Op.gte]: parseFloat(rating) };
    }

    const includeOptions = {
      model: Room,
      as: 'rooms',
      attributes: ['id', 'type', 'price', 'capacity', 'available'],
    };

    if (minPrice || maxPrice) {
      includeOptions.where = {};
      if (minPrice) {
        includeOptions.where.price = { ...includeOptions.where.price, [Op.gte]: parseFloat(minPrice) };
      }
      if (maxPrice) {
        includeOptions.where.price = { ...includeOptions.where.price, [Op.lte]: parseFloat(maxPrice) };
      }
      includeOptions.required = true;
    }

    const hotels = await Hotel.findAll({
      where,
      include: [includeOptions],
      order: [['rating', 'DESC']],
    });

    // Attach min price to each hotel for display
    const result = hotels.map((hotel) => {
      const hotelData = hotel.toJSON();
      const prices = hotelData.rooms.map((r) => parseFloat(r.price));
      hotelData.minPrice = prices.length > 0 ? Math.min(...prices) : null;
      return hotelData;
    });

    res.json({ hotels: result });
  } catch (error) {
    console.error('GetHotels error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/hotels/:id - Get hotel detail with rooms
const getHotelById = async (req, res) => {
  try {
    const hotel = await Hotel.findByPk(req.params.id, {
      include: [{
        model: Room,
        as: 'rooms',
      }],
    });

    if (!hotel) {
      return res.status(404).json({ message: 'Hotel not found' });
    }

    res.json({ hotel });
  } catch (error) {
    console.error('GetHotelById error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getHotels, getHotelById };
