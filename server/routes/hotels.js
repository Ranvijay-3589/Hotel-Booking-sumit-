const express = require('express');
const pool = require('../db/pool');

const router = express.Router();

// GET /api/hotels - search with filters
router.get('/', async (req, res) => {
  try {
    const { location, min_price, max_price, search } = req.query;
    let query = `
      SELECT h.*,
        MIN(r.price) as min_price,
        MAX(r.price) as max_price,
        COUNT(r.id) as room_types
      FROM hotels h
      LEFT JOIN rooms r ON r.hotel_id = h.id
    `;
    const conditions = [];
    const params = [];

    if (location) {
      params.push(`%${location}%`);
      conditions.push(`LOWER(h.location) LIKE LOWER($${params.length})`);
    }

    if (search) {
      params.push(`%${search}%`);
      conditions.push(`(LOWER(h.name) LIKE LOWER($${params.length}) OR LOWER(h.location) LIKE LOWER($${params.length}))`);
    }

    if (min_price) {
      params.push(min_price);
      conditions.push(`r.price >= $${params.length}`);
    }

    if (max_price) {
      params.push(max_price);
      conditions.push(`r.price <= $${params.length}`);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' GROUP BY h.id ORDER BY h.rating DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Hotels search error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/hotels/:id - hotel detail with rooms
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const hotelResult = await pool.query('SELECT * FROM hotels WHERE id = $1', [id]);
    if (hotelResult.rows.length === 0) {
      return res.status(404).json({ message: 'Hotel not found' });
    }

    const roomsResult = await pool.query('SELECT * FROM rooms WHERE hotel_id = $1 ORDER BY price ASC', [id]);

    // For each room, count bookings that overlap with potential dates
    const hotel = hotelResult.rows[0];
    hotel.rooms = roomsResult.rows;

    res.json(hotel);
  } catch (err) {
    console.error('Hotel detail error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
