const express = require('express');
const pool = require('../db/pool');

const router = express.Router();

// GET /api/hotels - search with filters
router.get('/', async (req, res) => {
  try {
    const { location, min_price, max_price, search } = req.query;

    let query = `
      SELECT h.*,
        COALESCE(MIN(r.price), 0) AS min_room_price,
        COALESCE(MAX(r.price), 0) AS max_room_price,
        COALESCE(SUM(r.available_rooms), 0) AS total_available
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
      conditions.push(`(LOWER(h.name) LIKE LOWER($${params.length}) OR LOWER(h.location) LIKE LOWER($${params.length}) OR LOWER(h.description) LIKE LOWER($${params.length}))`);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' GROUP BY h.id';

    if (min_price) {
      params.push(parseFloat(min_price));
      query += ` HAVING COALESCE(MIN(r.price), 0) >= $${params.length}`;
    }

    if (max_price) {
      if (min_price) {
        params.push(parseFloat(max_price));
        query += ` AND COALESCE(MIN(r.price), 0) <= $${params.length}`;
      } else {
        params.push(parseFloat(max_price));
        query += ` HAVING COALESCE(MIN(r.price), 0) <= $${params.length}`;
      }
    }

    query += ' ORDER BY h.rating DESC';

    const result = await pool.query(query, params);
    res.json({ hotels: result.rows });
  } catch (err) {
    console.error('Get hotels error:', err.message);
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

    const roomsResult = await pool.query(
      'SELECT * FROM rooms WHERE hotel_id = $1 ORDER BY price ASC',
      [id]
    );

    res.json({
      hotel: hotelResult.rows[0],
      rooms: roomsResult.rows,
    });
  } catch (err) {
    console.error('Get hotel error:', err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
